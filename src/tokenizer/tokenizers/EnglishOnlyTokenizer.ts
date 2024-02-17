import type { TrimTarget } from "../tokenizer";
import { DefaultTokenizer } from "./DefaultTokenizer";

type PreviousType = "none" | "trim" | "english" | "others";
const ENGLISH_PATTERN = /[a-zA-Z0-9_\-\\]/;
export class EnglishOnlyTokenizer extends DefaultTokenizer {
  tokenize(content: string, raw?: boolean): string[] {
    const tokenized = Array.from(this._tokenize(content, "indexing")).filter(
      (x) => x.word.match(ENGLISH_PATTERN),
    );
    return raw
      ? tokenized.map((x) => x.word)
      : tokenized
          .map((x) => x.word)
          .filter((x) => !x.match(this.getTrimPattern("indexing")));
  }

  recursiveTokenize(content: string): { word: string; offset: number }[] {
    const offsets = Array.from(this._tokenize(content, "input"))
      .filter((x) => !x.word.match(this.getTrimPattern("input")))
      .map((x) => x.offset);
    return [
      ...offsets.map((i) => ({
        word: content.slice(i),
        offset: i,
      })),
    ];
  }

  private *_tokenize(
    content: string,
    target: TrimTarget,
  ): Iterable<{ word: string; offset: number }> {
    let startIndex = 0;
    let previousType: PreviousType = "none";

    for (let i = 0; i < content.length; i++) {
      if (content[i].match(super.getTrimPattern(target))) {
        yield { word: content.slice(startIndex, i), offset: startIndex };
        previousType = "trim";
        startIndex = i;
        continue;
      }

      if (content[i].match(ENGLISH_PATTERN)) {
        if (previousType === "english" || previousType === "none") {
          previousType = "english";
          continue;
        }

        yield { word: content.slice(startIndex, i), offset: startIndex };
        previousType = "english";
        startIndex = i;
        continue;
      }

      if (previousType === "others" || previousType === "none") {
        previousType = "others";
        continue;
      }

      yield { word: content.slice(startIndex, i), offset: startIndex };
      previousType = "others";
      startIndex = i;
    }

    yield {
      word: content.slice(startIndex, content.length),
      offset: startIndex,
    };
  }
}
