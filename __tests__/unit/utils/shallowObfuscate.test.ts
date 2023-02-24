import { shallowObfuscate } from "../../../libs/utils";

describe("shallowObfuscate", () => {
  const obj = {
    a: "a",
    b: "b",
  };

  test("obfuscates single key", () => {
    const result = {
      a: "***",
      b: "b",
    };

    expect(shallowObfuscate(obj, ["a"])).toEqual(result);
  });

  test("obfuscates multiple keys", () => {
    const result = {
      a: "***",
      b: "***",
    };

    expect(shallowObfuscate(obj, ["a", "b"])).toEqual(result);
  });

  test("creates a shallow copy when keys are not provided", () => {
    const result = {
      a: "a",
      b: "b",
    };

    expect(shallowObfuscate(obj, [])).not.toBe(result);
    expect(shallowObfuscate(obj, [])).toEqual({
      a: "a",
      b: "b",
    });
  });
});
