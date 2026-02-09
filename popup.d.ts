// Used for WebStorm/PhPStorm type hinting
export class W2054Popup {
  content: string[];
  isFinished: boolean;
  isForm: boolean;

  constructor();

  assertNotFinished(): void;

  assertForm(): void;

  checkNewLine(): void;

  checkNewLineInline(): void;

  eatNewLine(): void;

  form(url: string): void;

  text(text: string, style?: string): void;

  addButton(text: string, onClick: string, style?: string): void;

  newline(): void;

  constant(key: string, value: string): void;

  checkbox(id: string, text: string, checked?: boolean, style?: string): void;

  indexSelect(id: string, text: string, values: string[], selectedIndex?: number, style?: string): void;

  markdown(text: string, style?: string): void;

  markdownInput(id: string, placeholder?: string, initialValue?: string, style?: string,
                previewStyle?: string, allowEmojis?: boolean): void;

  textInput(id: string, placeholder?: string, initialValue?: string, style?: string): void;

  addFormCopyPasteButtons(): void;

  finish(): void;

  open(): void;

  close(): void;
}
