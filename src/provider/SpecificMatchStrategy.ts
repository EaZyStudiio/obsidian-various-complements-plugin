import type { Word } from "../model/Word";
import type { SelectionHistoryStorage } from "../storage/SelectionHistoryStorage";
import type { IndexedWords } from "../ui/AutoCompleteSuggest";
import { suggestWords, suggestWordsByPartialMatch } from "./suggester";

type Name = "inherit" | "prefix" | "partial";

type Handler = (
  indexedWords: IndexedWords,
  query: string,
  max: number,
  option: {
    frontMatter?: string;
    selectionHistoryStorage?: SelectionHistoryStorage;
    fuzzy?: {
      minMatchScore: number;
    };
  },
) => Word[];

const neverUsedHandler = (..._args: any[]) => [];

export class SpecificMatchStrategy {
  private static readonly _values: SpecificMatchStrategy[] = [];

  static readonly INHERIT = new SpecificMatchStrategy(
    "inherit",
    neverUsedHandler,
  );
  static readonly PREFIX = new SpecificMatchStrategy("prefix", suggestWords);
  static readonly PARTIAL = new SpecificMatchStrategy(
    "partial",
    suggestWordsByPartialMatch,
  );

  private constructor(
    readonly name: Name,
    readonly handler: Handler,
  ) {
    SpecificMatchStrategy._values.push(this);
  }

  static fromName(name: string): SpecificMatchStrategy {
    return SpecificMatchStrategy._values.find((x) => x.name === name)!;
  }

  static values(): SpecificMatchStrategy[] {
    return SpecificMatchStrategy._values;
  }
}
