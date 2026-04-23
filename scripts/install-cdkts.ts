#!/usr/bin/env -S deno run -qA --ext=ts
import { Command } from "@cliffy/command";

await new Command()
  .name("install-cdkts")
  .action(async () => {
    const binDir = await Deno.realPath(`${import.meta.dirname}/../.pixi/envs/default/bin`);
    const cliPath = await Deno.realPath(`${import.meta.dirname}/../cli/main.ts`);
    if (Deno.build.os === "windows") {
      await Deno.writeTextFile(`${binDir}/cdkts.cmd`, `@deno "run" "-A" "${cliPath}" %*`);
    } else {
      await Deno.writeTextFile(`${binDir}/cdkts`, `#!/usr/bin/env bash\nexec deno run -A ${cliPath} "$@"`);
      await Deno.chmod(`${binDir}/cdkts`, 0o755);
    }
  })
  .parse();
