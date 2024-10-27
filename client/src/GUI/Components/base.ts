import {signalsRegistrar} from '../signals.ts';

export abstract class ExtendedHTMLElement<Props> extends HTMLElement {
  protected getSignal<T>(signalAttributeKey: string) {
    const id = this.getAttribute(signalAttributeKey);

    if (!id) {
      throw new Error(`No signal ID provided for ${signalAttributeKey}`);
    }

    return signalsRegistrar.getSignalById<T>(id);
  }

  abstract getAttributes(): Props;

  getElementById<T extends HTMLElement>(id: string): T {
    const element = this.shadowRoot!.getElementById(id);

    if (element === null) {
      throw new Error(`No signal ID provided for ${id}`);
    }

    return element as T;
  }

  setTemplate(template: string) {
    this.shadowRoot!.innerHTML = template;
  }
}
