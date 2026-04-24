import { Project } from "@brad-jones/cdkts/automate";
import MyStack1 from "./my_stack_1.ts";
import MyStack2 from "./my_stack_2.ts";

// Apply the first stack
let stack1State;
{
  await using project = new Project({
    projectDir: `${import.meta.dirname}/out1`,
    stack: new MyStack1(),
  });
  stack1State = await project.apply();
}

// Apply the second stack which depends on the state of the first
{
  await using project = new Project({
    projectDir: `${import.meta.dirname}/out2`,
    stack: new MyStack2({
      specialId: stack1State.values!.outputs!.specialId.value,
    }),
  });
  await project.apply();
}
