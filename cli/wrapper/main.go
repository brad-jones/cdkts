package main

import (
	"bytes"
	"compress/gzip"
	"crypto/sha256"
	_ "embed"
	"fmt"
	"io"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"syscall"
)

//go:embed deno.gz
var denoGzippedBytes []byte

var cdkTsVersion = "0.2.6"

func sha256Sum(data []byte) string {
	hash := sha256.Sum256(data)
	return fmt.Sprintf("%x", hash)
}

func extractDeno(path string) error {
	// Create the output file
	outFile, err := os.Create(path)
	if err != nil {
		return fmt.Errorf("failed to create file: %w", err)
	}

	// Create gzip reader
	reader, err := gzip.NewReader(bytes.NewReader(denoGzippedBytes))
	if err != nil {
		outFile.Close()
		return fmt.Errorf("failed to create gzip reader: %w", err)
	}
	defer reader.Close()

	// Stream decompressed data directly to file
	if _, err := io.Copy(outFile, reader); err != nil {
		outFile.Close()
		return fmt.Errorf("failed to decompress and write data: %w", err)
	}

	// Close the file before setting permissions
	if err := outFile.Close(); err != nil {
		return fmt.Errorf("failed to close file: %w", err)
	}

	// Set appropriate permissions
	perm := os.FileMode(0644)
	if runtime.GOOS != "windows" {
		perm = 0755
	}

	if err := os.Chmod(path, perm); err != nil {
		return fmt.Errorf("failed to set file permissions: %w", err)
	}

	return nil
}

// execBinary executes the binary at the given path with the provided arguments.
// On Unix systems, it uses syscall.Exec to replace the current process.
// On Windows, syscall.Exec is not available, so we use exec.Command.
func execBinary(binaryPath string, args []string) error {
	if runtime.GOOS != "windows" {
		argv := append([]string{binaryPath}, args...)
		if err := syscall.Exec(binaryPath, argv, os.Environ()); err != nil {
			return fmt.Errorf("error running binary: %w", err)
		}
		return nil
	}

	cmd := exec.Command(binaryPath, args...)
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			os.Exit(exitErr.ExitCode())
		}
		return fmt.Errorf("error running binary: %w", err)
	}

	return nil
}

// findStackFilePath parses the command line arguments to locate the stack file path.
// It handles:
// - Global options (--clean, --flavor, --tf-binary-path, --tf-version, --project-dir)
// - Command-specific options (--destroy, --re-init, -o/--out, -p/--plan, -a/--all)
// - Both known commands (init, plan, apply, etc.) and escape hatch commands
// - The "clean" command which has no stack file
func findStackFilePath(args []string) string {
	if len(args) < 2 {
		return ""
	}

	// Commands that don't take a stack file path
	noStackCommands := map[string]bool{
		"clean": true,
	}

	// Options that take a value (both global and command-specific)
	optionsWithValue := map[string]bool{
		"--flavor":         true,
		"--tf-binary-path": true,
		"--tf-version":     true,
		"--project-dir":    true,
		"-o":               true,
		"--out":            true,
		"-p":               true,
		"--plan":           true,
	}

	positionalArgs := []string{}

	// Parse arguments, skipping options and collecting positional arguments
	for i := 1; i < len(args); i++ {
		arg := args[i]

		// Stop at -- separator (marks start of pass-through args)
		if arg == "--" {
			break
		}

		// Handle option flags
		if strings.HasPrefix(arg, "-") {
			// Check if it's a flag with = syntax (e.g., --flavor=tofu)
			if strings.Contains(arg, "=") {
				continue
			}

			// Check if it's an option that takes a value
			if optionsWithValue[arg] {
				i++ // Skip the next arg (the value)
				continue
			}

			// Otherwise it's a boolean flag (--clean, --destroy, --re-init, etc.), just skip it
			continue
		}

		// It's a positional argument
		positionalArgs = append(positionalArgs, arg)
	}

	// Need at least one positional arg (the command)
	if len(positionalArgs) < 1 {
		return ""
	}

	command := positionalArgs[0]

	// If it's the clean command, there's no stack file
	if noStackCommands[command] {
		return ""
	}

	// For all other commands (both known commands and escape hatch),
	// the second positional arg is the stack file path
	if len(positionalArgs) < 2 {
		return ""
	}

	return positionalArgs[1]
}

// locateDenoConfigFile searches for a Deno configuration file (deno.json or deno.jsonc)
// starting from the script file's directory and traversing upward through parent
// directories until found or root is reached.
// Accepts both regular file paths and file:// URLs.
func locateDenoConfigFile(scriptPath string) string {
	// Convert file URL to path if needed
	if strings.HasPrefix(scriptPath, "file://") {
		parsedURL, err := url.Parse(scriptPath)
		if err == nil && parsedURL.Scheme == "file" {
			// On Windows, url.Parse for file:///C:/path gives Path="/C:/path"
			// We need to remove the leading slash before the drive letter
			path := parsedURL.Path
			if len(path) > 2 && path[0] == '/' && path[2] == ':' {
				path = path[1:]
			}
			scriptPath = filepath.FromSlash(path)
		}
	}

	// Check if scriptPath has a protocol scheme other than file://
	// If so, return empty string as remote script loading is not supported
	if strings.Contains(scriptPath, "://") {
		return ""
	}

	// Start from the directory containing the script
	currentDir := filepath.Dir(scriptPath)
	volumeName := filepath.VolumeName(currentDir)

	// Walk up the directory tree
	for {
		// Check for deno.json
		denoJsonPath := filepath.Join(currentDir, "deno.json")
		if _, err := os.Stat(denoJsonPath); err == nil {
			return denoJsonPath
		}

		// Check for deno.jsonc
		denoJsoncPath := filepath.Join(currentDir, "deno.jsonc")
		if _, err := os.Stat(denoJsoncPath); err == nil {
			return denoJsoncPath
		}

		// Get parent directory
		parentDir := filepath.Dir(currentDir)

		// Check if we've reached the root
		// On Windows: "C:\" becomes "C:\", on Unix: "/" becomes "/"
		if parentDir == currentDir || parentDir == volumeName || parentDir == string(filepath.Separator) {
			break
		}

		currentDir = parentDir
	}

	// No config file found
	return ""
}

func main() {
	// Build a unique path for the embedded Deno binary based on its content hash
	exeSuffix := ""
	if runtime.GOOS == "windows" {
		exeSuffix = ".exe"
	}
	denoPath := fmt.Sprintf("%s/cdkts-embedded-%s%s", os.TempDir(), sha256Sum(denoGzippedBytes), exeSuffix)

	// Check if the file already exists and is valid before writing it again
	if _, err := os.Stat(denoPath); os.IsNotExist(err) {
		// If not found, write the gzipped bytes to the file and decompress it
		if err := extractDeno(denoPath); err != nil {
			fmt.Fprintf(os.Stderr, "Error extracting deno: %v\n", err)
			os.Exit(1)
		}
	}

	// Locate Deno configuration file for the stack file, if given
	configArgs := []string{}
	stackFilePath := findStackFilePath(os.Args)
	if stackFilePath != "" {
		configFile := locateDenoConfigFile(stackFilePath)
		if configFile != "" {
			configArgs = append(configArgs, "--config", configFile)
		}
	}

	// Build the argument list for Deno, starting with the config arguments (if any) followed by the original arguments (excluding the wrapper itself)
	args := []string{"run"}
	args = append(args, configArgs...)
	args = append(args, []string{"-qA", fmt.Sprintf("https://jsr.io/@brad-jones/cdkts/%s/cli/main.ts", cdkTsVersion)}...)
	args = append(args, os.Args[1:]...)

	// Execute deno with the original arguments (excluding the wrapper itself)
	if err := execBinary(denoPath, args); err != nil {
		fmt.Fprintf(os.Stderr, "Error running deno: %v\n", err)
		os.Exit(1)
	}
}
