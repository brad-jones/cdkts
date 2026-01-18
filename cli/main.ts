import { Command } from "@cliffy/command";

await new Command()
  .name("cdkts")
  .action(() => {
    console.log("Coming Soon...");
  })
  .parse();
