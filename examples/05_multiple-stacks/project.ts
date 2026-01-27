import { Project } from "@brad-jones/cdkts/automate";
import MyStack1 from "./my_stack_1.ts";
import MyStack2 from "./my_stack_2.ts";

/*
  While this works, how would you create a compiled stack from this?
  You could compile the individual stacks perhaps.
  And perhaps we can come up with a way of injecting the Stack Inputs from an environment variable, CLI args, etc.
  But to actually compile this orchestration as it stands and treat it as "the" stack file is difficult.
  We are missing the equivalent of the CDK App Construct.
*/

// Maybe we can re-export the stacks and when we detect no default export we assume all exports are Stack classes.
// Then we can create lockfiles & download the providers for each stack and still bundle it all into one deno binary.
export { MyStack1, MyStack2 };

// And then this next part wouldn't be automatically generated because by its very nature it will be custom every time.
if (import.meta.main) {
  // Apply the first stack
  const stack1State = await new Project({
    projectDir: `${import.meta.dirname}/out1`,
    stack: new MyStack1(
      // Assuming that the first stack also had inputs that needed to be given.
      // Are we implying that the developer is responsible for writing code here to inject any Stack inputs into this first stack?
      // ie: By using Deno.env.get or parsing CLI arguments themselves or similar?
      // In a single stack scenario how are going to inject any Stack inputs? Even just for the eventual "cdkts apply ./my_stack.ts" command
      // What about native TF Vars? Do we integrate with those somehow or do they remain a completely separate concept?
      // If we used TF Vars then that solves the initial injection problem. ie: we defer the issue to terraform and all the ways of setting vars are available.
      // eg something like `cdkts apply ./my_stack.ts -var foo=bar` becomes very easy
      // But then how do we deal with stack inputs that are given programmatically like the below stack?
      // Maybe the answer is to have the Stack constructor automatically set TF_VAR_ env vars?
      // But is that running in the write context? No no no
      // The answer is to expose the stack inputs property to the Project class.
      // That can then set TF_VAR_ env vars or generate a tfvars file or whatever at init time.
      // This all means that the generic Stack Input & Outputs type parameters are purly for type support.
      // We are still relying on the stack developer to register var & output blocks in the HCL.
      // If Inputs & Outputs were based around Zod or similar maybe we could do some reflection to automatically create var & output blocks? Or at least var blocks. Because we need to know where the value comes from for an output.
    ),
  }).apply();

  // Apply the second stack which depends on the state of the first
  await new Project({
    projectDir: `${import.meta.dirname}/out2`,
    stack: new MyStack2({
      specialId: stack1State.values!.outputs!.specialId.value,
    }),
  }).apply();
}
