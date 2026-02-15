package main

import (
	"bytes"
	"compress/gzip"
	"crypto/sha256"
	_ "embed"
	"fmt"
	"io"
	"os"
	"os/exec"
	"runtime"
	"syscall"
)

//go:embed deno.gz
var denoGzippedBytes []byte

// This will be replaced by the build script
var cdkTsVersion = "0.6.6"

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

	// Build the argument list for Deno
	args := []string{"run", "-qA", fmt.Sprintf("jsr:@brad-jones/cdkts@%s/cli", cdkTsVersion)}
	args = append(args, os.Args[1:]...)

	// Execute deno with the original arguments (excluding the wrapper itself)
	if err := execBinary(denoPath, args); err != nil {
		fmt.Fprintf(os.Stderr, "Error running deno: %v\n", err)
		os.Exit(1)
	}
}
