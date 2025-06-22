import { debounce, normalizePath, Notice, Plugin } from "obsidian";
import { merge } from "ts-deepmerge";
import { AppHelper } from "./app-helper";
import {
  DEFAULT_SETTINGS,
  type Settings,
  VariousComplementsSettingTab,
} from "./setting/settings";
import { AutoCompleteSuggest } from "./ui/AutoCompleteSuggest";
import { CustomDictionaryWordAddModal } from "./ui/CustomDictionaryWordAddModal";
import { ProviderStatusBar } from "./ui/ProviderStatusBar";
import { DEFAULT_HISTORIES_PATH } from "./util/path";

export default class VariousComponents extends Plugin {
  appHelper: AppHelper;
  settings: Settings;
  settingTab: VariousComplementsSettingTab;
  suggester: AutoCompleteSuggest;
  statusBar?: ProviderStatusBar;

  onunload() {
    super.onunload();
    this.suggester.unregister();
  }

  async onload() {
    this.appHelper = new AppHelper(this.app);

    await this.loadSettings();
    this.settingTab = new VariousComplementsSettingTab(this.app, this);
    this.addSettingTab(this.settingTab);
    if (this.appHelper.isMobile() && this.settings.disableOnMobile) {
      // End
      return;
    }

    this.registerEvent(
      this.app.workspace.on("editor-menu", (menu) => {
        if (!this.appHelper.getSelection()) {
          return;
        }

        menu.addItem((item) =>
          item
            .setTitle("Add to custom dictionary")
            .setIcon("stacked-levels")
            .onClick(() => {
              this.addWordToCustomDictionary();
            }),
        );
      }),
    );

    this.statusBar = ProviderStatusBar.new(
      this.addStatusBarItem(),
      this.settings.showMatchStrategy,
      this.settings.showIndexingStatus,
      this.settings.showComplementAutomatically,
    );
    this.statusBar.setOnClickStrategyListener(async () => {
      await this.settingTab.toggleMatchStrategy();
    });
    this.statusBar.setOnClickComplementAutomatically(async () => {
      await this.settingTab.toggleComplementAutomatically();
    });

    const debouncedSaveData = debounce(async () => {
      await this.appHelper.saveJson(
        normalizePath(
          this.settings.intelligentSuggestionPrioritization.historyFilePath ||
            DEFAULT_HISTORIES_PATH,
        ),
        this.suggester.selectionHistoryStorage?.data ?? {},
      );
    }, 5000);

    this.suggester = await AutoCompleteSuggest.new(
      this.app,
      this.settings,
      this.statusBar,
      debouncedSaveData,
    );
    this.registerEditorSuggest(this.suggester);

    this.addCommand({
      id: "reload-custom-dictionaries",
      name: "Reload custom dictionaries",
      hotkeys: [{ modifiers: ["Mod", "Shift"], key: "r" }],
      callback: async () => {
        await this.suggester.refreshCustomDictionaryTokens();
      },
    });

    this.addCommand({
      id: "reload-current-vault",
      name: "Reload current vault",
      callback: async () => {
        await this.suggester.refreshCurrentVaultTokens();
      },
    });

    this.addCommand({
      id: "toggle-match-strategy",
      name: "Toggle Match strategy",
      callback: async () => {
        await this.settingTab.toggleMatchStrategy();
      },
    });

    this.addCommand({
      id: "toggle-complement-automatically",
      name: "Toggle Complement automatically",
      callback: async () => {
        await this.settingTab.toggleComplementAutomatically();
      },
    });

    this.addCommand({
      id: "show-suggestions",
      name: "Show suggestions",
      hotkeys: [{ modifiers: ["Mod"], key: " " }],
      callback: async () => {
        this.suggester.triggerComplete();
      },
    });

    this.addCommand({
      id: "hide-suggestions",
      name: "Hide suggestions",
      callback: async () => {
        this.suggester.hideCompletion();
      },
    });

    this.addCommand({
      id: "fallback-linkify",
      name: "Fallback linkify",
      callback: async () => {
        this.suggester.triggerComplete({ fallbackLinkify: true });
      },
    });

    this.addCommand({
      id: "add-word-custom-dictionary",
      name: "Add a word to a custom dictionary",
      hotkeys: [{ modifiers: ["Mod", "Shift"], key: " " }],
      callback: async () => {
        this.addWordToCustomDictionary();
      },
    });

    this.addCommand({
      id: "predictable-complements",
      name: "Predictable complement",
      callback: async () => {
        this.suggester.predictableComplete();
      },
    });

    this.addCommand({
      id: "copy-plugin-settings",
      name: "Copy plugin settings",
      callback: async () => {
        await navigator.clipboard.writeText(
          this.settingTab.getPluginSettingsAsJsonString(),
        );
        // noinspection ObjectAllocationIgnored
        new Notice("Copy settings of Various Complements");
      },
    });
  }

  async loadSettings(): Promise<void> {
    const currentSettings = (await this.loadData()) as Settings;
    this.settings = merge.withOptions(
      { mergeArrays: false },
      DEFAULT_SETTINGS,
      currentSettings ?? {},
    );
  }

  async saveSettings(
    needUpdateTokens: {
      currentFile?: boolean;
      currentVault?: boolean;
      customDictionary?: boolean;
      internalLink?: boolean;
      frontMatter?: boolean;
      intelligentSuggestionPrioritization?: boolean;
    } = {},
  ): Promise<void> {
    await this.saveData(this.settings);
    await this.suggester.updateSettings(this.settings);
    if (needUpdateTokens.currentFile) {
      await this.suggester.refreshCurrentFileTokens();
    }
    if (needUpdateTokens.currentVault) {
      await this.suggester.refreshCurrentVaultTokens();
    }
    if (needUpdateTokens.customDictionary) {
      await this.suggester.refreshCustomDictionaryTokens();
    }
    if (needUpdateTokens.internalLink) {
      this.suggester.refreshInternalLinkTokens();
    }
    if (needUpdateTokens.frontMatter) {
      this.suggester.refreshFrontMatterTokens();
    }
    if (needUpdateTokens.intelligentSuggestionPrioritization) {
      await this.suggester.refreshIntelligentSuggestionPrioritization();
    }
  }

  addWordToCustomDictionary() {
    const selectedWord = this.appHelper.getSelection();
    const provider = this.suggester.customDictionaryWordProvider;
    const modal = new CustomDictionaryWordAddModal(
      this.app,
      provider.editablePaths,
      selectedWord,
      this.settings.delimiterToDivideSuggestionsForDisplayFromInsertion,
      async (dictionaryPath, _word) => {
        // TODO: If support for JSON, this implementation doesn't work correctly
        const word = {
          ..._word,
          caretSymbol: this.settings.caretLocationSymbolAfterComplement,
        };

        if (provider.wordByValue[word.value]) {
          // noinspection ObjectAllocationIgnored
          new Notice(`⚠ ${word.value} already exists`, 0);
          return;
        }

        await provider.addWordWithDictionary(word, dictionaryPath, {
          emoji: this.settings.matchingWithoutEmoji,
          accentsDiacritics:
            this.settings.treatAccentDiacriticsAsAlphabeticCharacters,
        });
        // noinspection ObjectAllocationIgnored
        new Notice(`Added ${word.value}`);
        modal.close();
      },
    );

    modal.open();
  }
}
