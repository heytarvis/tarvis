export type CustomComponentFn = (
  wrapperElement: HTMLElement,
  props: Record<string, unknown>
) => void;

export type CustomComponentName = 'AssistantMessage' | 'UserMessage' | string;

export type CustomComponentFns = {
  [key in CustomComponentName]?: CustomComponentFn;
};
