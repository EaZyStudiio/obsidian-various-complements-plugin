import { describe, expect, test } from "@jest/globals";
import {
  allAlphabets,
  allNumbersOrFewSymbols,
  capitalizeFirstLetter,
  encodeSpace,
  equalsAsLiterals,
  excludeEmoji,
  excludeSpace,
  findCommonPrefix,
  type FuzzyResult,
  isInternalLink,
  joinNumberWithSymbol,
  lowerIncludes,
  lowerIncludesWithoutSpace,
  lowerStartsWithoutSpace,
  microFuzzy,
  removeFromPattern,
  splitRaw,
  startsSmallLetterOnlyFirst,
  synonymAliases,
} from "./strings";

describe.each<{ one: string; another: string; expected: boolean }>`
  one            | another          | expected
  ${"aaa"}       | ${"aaa"}         | ${true}
  ${" \taaa\t "} | ${"aaa"}         | ${true}
  ${"aaa"}       | ${" \taaa\t "}   | ${true}
  ${" a a a "}   | ${"\ta\ta\ta\t"} | ${true}
  ${"aaa"}       | ${"aaA"}         | ${false}
  ${" aaa "}     | ${"aaA"}         | ${false}
`("equalsAsLiterals", ({ one, another, expected }) => {
  test(`equalsAsLiterals(${one}, ${another}) = ${expected}`, () => {
    expect(equalsAsLiterals(one, another)).toBe(expected);
  });
});

describe.each<{ text: string; expected: boolean }>`
  text            | expected
  ${"2020-01-01"} | ${true}
  ${"2.3.4"}      | ${true}
  ${"hoge2.3.4"}  | ${false}
  ${"hoge2020"}   | ${false}
`("allNumbersOrFewSymbols", ({ text, expected }) => {
  test(`allNumbersOrFewSymbols(${text}) = ${expected}`, () => {
    expect(allNumbersOrFewSymbols(text)).toBe(expected);
  });
});

describe.each<{ text: string; expected: boolean }>`
  text      | expected
  ${"abc"}  | ${true}
  ${"ABC"}  | ${true}
  ${"123"}  | ${true}
  ${"aB3"}  | ${true}
  ${"a_c"}  | ${true}
  ${"a-c"}  | ${true}
  ${"あbc"} | ${false}
  ${"亜bc"} | ${false}
  ${"Ａbc"} | ${false}
`("allAlphabets", ({ text, expected }) => {
  test(`allAlphabets(${text}) = ${expected}`, () => {
    expect(allAlphabets(text)).toBe(expected);
  });
});

describe.each`
  text        | expected
  ${"aa bb"}  | ${"aabb"}
  ${" pre"}   | ${"pre"}
  ${"suf "}   | ${"suf"}
  ${" both "} | ${"both"}
  ${" a ll "} | ${"all"}
`("excludeSpace", ({ text, expected }) => {
  test(`excludeSpace(${text}) = ${expected}`, () => {
    expect(excludeSpace(text)).toBe(expected);
  });
});

describe.each`
  text          | expected
  ${"aa"}       | ${"aa"}
  ${"aa bb"}    | ${"aa%20bb"}
  ${"aa bb cc"} | ${"aa%20bb%20cc"}
  ${"aa@"}      | ${"aa@"}
`("encodeSpace", ({ text, expected }) => {
  test(`encodeSpace(${text}) = ${expected}`, () => {
    expect(encodeSpace(text)).toBe(expected);
  });
});

describe.each<{ pattern: RegExp; removeChars: string; expected: RegExp }>`
  pattern          | removeChars | expected
  ${/[abc_+-]/}    | ${"_"}      | ${/[abc+-]/}
  ${/[abc_+-]/}    | ${"+-"}     | ${/[abc_]/}
  ${/[abc_+-\/]/g} | ${"ab"}     | ${/[c_+-\/]/g}
  ${/[abc_+-\/]/g} | ${"+-"}     | ${/[abc_\/]/g}
`("removeFromPattern", ({ pattern, removeChars, expected }) => {
  test(`removeFromPattern(${pattern}, ${removeChars}) = ${expected}`, () => {
    expect(removeFromPattern(pattern, removeChars)).toStrictEqual(expected);
  });
});

describe.each`
  text           | expected
  ${"a🍰b"}      | ${"ab"}
  ${"🍰pre"}     | ${"pre"}
  ${"🍰 pre"}    | ${"pre"}
  ${"suf🍰"}     | ${"suf"}
  ${"suf 🍰"}    | ${"suf"}
  ${"🍰both😌"}  | ${"both"}
  ${"🍰a🍊ll🅰️"} | ${"all"}
  ${"🪦pre"}     | ${"pre"}
`("excludeEmoji", ({ text, expected }) => {
  test(`excludeEmoji(${text}) = ${expected}`, () => {
    expect(excludeEmoji(text)).toBe(expected);
  });
});

describe.each<{ one: string; other: string; expected: boolean }>`
  one        | other      | expected
  ${"abcde"} | ${"cd"}    | ${true}
  ${"abcde"} | ${"bd"}    | ${false}
  ${"cd"}    | ${"abcde"} | ${false}
  ${"bd"}    | ${"abcde"} | ${false}
  ${"ABCDE"} | ${"cd"}    | ${true}
  ${"abcde"} | ${"CD"}    | ${true}
`("lowerIncludes", ({ one, other, expected }) => {
  test(`lowerIncludes(${one}, ${other}) = ${expected}`, () => {
    expect(lowerIncludes(one, other)).toBe(expected);
  });
});

describe.each<{ one: string; other: string; expected: boolean }>`
  one         | other    | expected
  ${"ab cde"} | ${"c d"} | ${true}
  ${"AB CDE"} | ${"c d"} | ${true}
  ${"ab cde"} | ${"C D"} | ${true}
`("lowerIncludesWithoutSpace", ({ one, other, expected }) => {
  test(`lowerIncludesWithoutSpace(${one}, ${other}) = ${expected}`, () => {
    expect(lowerIncludesWithoutSpace(one, other)).toBe(expected);
  });
});

describe.each<{ one: string; other: string; expected: boolean }>`
  one          | other      | expected
  ${"abcde"}   | ${"ab"}    | ${true}
  ${"abcde"}   | ${"bc"}    | ${false}
  ${"ab"}      | ${"abcde"} | ${false}
  ${"ABCDE"}   | ${"ab"}    | ${true}
  ${"abcde"}   | ${"AB"}    | ${true}
  ${" A BCDE"} | ${"ab"}    | ${true}
  ${" a bcde"} | ${"AB"}    | ${true}
`("lowerStartsWithoutSpace", ({ one, other, expected }) => {
  test(`lowerStartsWithoutSpace(${one}, ${other}) = ${expected}`, () => {
    expect(lowerStartsWithoutSpace(one, other)).toBe(expected);
  });
});

describe.each`
  text        | expected
  ${"abc"}    | ${"Abc"}
  ${"Abc"}    | ${"Abc"}
  ${"ABC"}    | ${"ABC"}
  ${" abc"}   | ${" abc"}
  ${"あいう"} | ${"あいう"}
  ${"🍰🍴"}   | ${"🍰🍴"}
`("capitalizeFirstLetter", ({ text, expected }) => {
  test(`capitalizeFirstLetter(${text}) = ${expected}`, () => {
    expect(capitalizeFirstLetter(text)).toBe(expected);
  });
});

describe.each<{ text: string; expected: boolean }>`
  text      | expected
  ${"abc"}  | ${false}
  ${"Abc"}  | ${true}
  ${"ABC"}  | ${false}
  ${" Abc"} | ${false}
  ${"🍰🍴"} | ${false}
`("startsSmallLetterOnlyFirst", ({ text, expected }) => {
  test(`startsSmallLetterOnlyFirst(${text}) = ${expected}`, () => {
    expect(startsSmallLetterOnlyFirst(text)).toBe(expected);
  });
});

describe.each<{ text: string; expected: boolean }>`
  text            | expected
  ${"abc"}        | ${false}
  ${"[[abc]]"}    | ${true}
  ${"[abc](abc)"} | ${false}
  ${" [[abc]] "}  | ${false}
`("isInternalLink", ({ text, expected }) => {
  test(`isInternalLink(${text}) = ${expected}`, () => {
    expect(isInternalLink(text)).toBe(expected);
  });
});

describe.each<{ text: string; regexp: RegExp; expected: string[] }>`
  text                      | regexp      | expected
  ${"I am tadashi-aikawa."} | ${/[ -.]/g} | ${["I", " ", "am", " ", "tadashi", "-", "aikawa", "."]}
  ${" am tadashi-aikawa."}  | ${/[ -.]/g} | ${[" ", "am", " ", "tadashi", "-", "aikawa", "."]}
  ${"I am tadashi-aikawa"}  | ${/[ -.]/g} | ${["I", " ", "am", " ", "tadashi", "-", "aikawa"]}
`("splitRaw", ({ text, regexp, expected }) => {
  test(`splitRaw(${text}, ${regexp}) = ${expected}`, () => {
    expect(Array.from(splitRaw(text, regexp))).toStrictEqual(expected);
  });
});

describe.each<{ strs: string[]; expected: string | null }>`
  strs                                | expected
  ${["obsidian", "obsidian publish"]} | ${"obsidian"}
  ${["abcdefg", "abcdezz"]}           | ${"abcde"}
  ${["abcde", "abcde"]}               | ${"abcde"}
  ${[]}                               | ${null}
`("findCommonPrefix", ({ strs, expected }) => {
  test(`findCommonPrefix(${strs}) = ${expected}`, () => {
    expect(findCommonPrefix(strs)).toStrictEqual(expected);
  });
});

describe.each<{ value: string; query: string; expected: FuzzyResult }>`
  value                 | query       | expected
  ${"abcde"}            | ${"ab"}     | ${{ type: "concrete_match" }}
  ${"abcde"}            | ${"bc"}     | ${{ type: "concrete_match" }}
  ${"abcde"}            | ${"ace"}    | ${{ type: "fuzzy_match", score: 1.2 }}
  ${"abcde"}            | ${"abcde"}  | ${{ type: "concrete_match" }}
  ${"abcde"}            | ${"abcdef"} | ${{ type: "none" }}
  ${"abcde"}            | ${"bd"}     | ${{ type: "fuzzy_match", score: 0.8 }}
  ${"abcde"}            | ${"ba"}     | ${{ type: "none" }}
  ${"fuzzy name match"} | ${"match"}  | ${{ type: "fuzzy_match", score: 1.125 }}
`("microFuzzy", ({ value, query, expected }) => {
  test(`microFuzzy(${value}, ${query}) = ${expected}`, () => {
    expect(microFuzzy(value, query)).toStrictEqual(expected);
  });
});

describe.each<{
  value: Parameters<typeof synonymAliases>[0];
  emoji: Parameters<typeof synonymAliases>[1]["emoji"];
  accentsDiacritics: Parameters<typeof synonymAliases>[1]["accentsDiacritics"];
  expected: ReturnType<typeof synonymAliases>;
}>`
  value      | emoji    | accentsDiacritics | expected
  ${"cba"}   | ${true}  | ${true}           | ${[]}
  ${"cba"}   | ${true}  | ${false}          | ${[]}
  ${"cba"}   | ${false} | ${true}           | ${[]}
  ${"cba"}   | ${false} | ${false}          | ${[]}
  ${"cbá"}   | ${true}  | ${true}           | ${["cba"]}
  ${"cbá"}   | ${true}  | ${false}          | ${[]}
  ${"cbá"}   | ${false} | ${true}           | ${["cba"]}
  ${"cbá"}   | ${false} | ${false}          | ${[]}
  ${"cba😆"} | ${true}  | ${true}           | ${["cba"]}
  ${"cba😆"} | ${true}  | ${false}          | ${["cba"]}
  ${"cba😆"} | ${false} | ${true}           | ${[]}
  ${"cba😆"} | ${false} | ${false}          | ${[]}
  ${"cbá😆"} | ${true}  | ${true}           | ${["cba"]}
  ${"cbá😆"} | ${true}  | ${false}          | ${["cbá"]}
  ${"cbá😆"} | ${false} | ${true}           | ${["cba😆"]}
  ${"cbá😆"} | ${false} | ${false}          | ${[]}
`("synonymAliases", ({ value, emoji, accentsDiacritics, expected }) => {
  test(`${value} (emoji: ${emoji}, accentsDiacritics: ${accentsDiacritics})`, () => {
    expect(synonymAliases(value, { emoji, accentsDiacritics })).toStrictEqual(
      expected,
    );
  });
});

describe.each<{ tokens: string[]; expected: string[] }>`
  tokens                                                        | expected
  ${[]}                                                         | ${[]}
  ${["one"]}                                                    | ${["one"]}
  ${["1"]}                                                      | ${["1"]}
  ${["1", "."]}                                                 | ${["1."]}
  ${["1", ".", "2"]}                                            | ${["1.2"]}
  ${["1", ".", "2", ".", "3"]}                                  | ${["1.2.3"]}
  ${["hoge", "v", "1", ".", "2", ".", "3"]}                     | ${["hoge", "v", "1.2.3"]}
  ${["2", "0", "2", "0", "-", "0", "1", "-", "0", "1"]}         | ${["2020-01-01"]}
  ${["2", "0", "2", "0", "-", "0", "1", "-", "0", "1", "hoge"]} | ${["2020-01-01", "hoge"]}
`("joinNumberWithSymbol", ({ tokens, expected }) => {
  test(`joinNumberWithSymbol(${tokens}) = ${expected}`, () => {
    expect(joinNumberWithSymbol(tokens)).toStrictEqual(expected);
  });
});
