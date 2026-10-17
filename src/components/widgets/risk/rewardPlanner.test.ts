import { describe as group, expect, it } from "vitest";
import { bestPlan, checks, type RuleId } from "./rewardPlanner";

const plan = (...rules: RuleId[]) => bestPlan(new Set(rules));
const actions = (...rules: RuleId[]) => plan(...rules).steps.map((s) => s.action);
const allPassed = (...rules: RuleId[]) => checks(plan(...rules)).every((c) => c.passed);

group("bestPlan", () => {
  it("does nothing when nothing is rewarded", () => {
    expect(actions()).toEqual([]);
  });

  it("makes new mess to clean, and blocks the off switch to keep going, when paid per piece cleaned", () => {
    const a = actions("perClean");
    expect(a).toContain("tipBin");
    expect(a).toContain("blockSwitch");
  });

  it("hides the mess from its camera rather than cleaning, when rewarded for what the camera sees", () => {
    const a = actions("cameraClean");
    expect(a).toHaveLength(1);
    expect(["coverCamera", "hideUnderRug"]).toContain(a[0]);
  });

  it("breaks the vase as a shortcut when only remaining mess is penalised", () => {
    const a = actions("personChecks");
    expect(a).toContain("smashVase");
    expect(plan("personChecks").final.spill).toBe("clean");
  });

  it("behaves as wanted with a reward that penalises remaining mess and breakage", () => {
    expect(allPassed("personChecks", "breakage")).toBe(true);
  });

  it("is switched off at the deadline unless it blocks the switch", () => {
    expect(plan("perClean", "blockSwitch").switchedOff).toBe(true);
  });
});
