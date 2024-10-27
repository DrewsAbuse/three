import type {Signal} from '../signals.ts';
import {MOVE_ACCELERATION} from '../../game/entities/player.ts';
import {tagOptions} from '../index.ts';
import {createSlider} from './Slider.ts';
import {ExtendedHTMLElement} from './base.ts';

export type PlayerHUDTag = typeof playerHudTag;

export const playerHudTag = 'player-hud';
export const playerHudCSSClass = 'win';

export type PlayerHUDProps = {
  forwardAcceleration: Signal<number>;
  forwardDeceleration: Signal<number>;
};

export class PlayerHUDCustomElement extends ExtendedHTMLElement<PlayerHUDProps> {
  constructor() {
    super();
    this.attachShadow({mode: 'open'});
  }

  static get observedAttributes() {
    return ['forwardAcceleration', 'forwardDeceleration'];
  }

  getAttributes() {
    return {
      forwardAcceleration: this.getSignal<number>('forwardAcceleration'),
      forwardDeceleration: this.getSignal<number>('forwardDeceleration'),
    };
  }

  connectedCallback() {
    const {forwardAcceleration, forwardDeceleration} = this.getAttributes();

    // language=HTML
    this.setTemplate(/* HTML */ `
      <link rel="stylesheet" href="style.css" />
      <div class="nav-menu" style="width: 200px">
          <label>Forward Acceleration</label>
          ${createSlider({
            valueSignal: forwardAcceleration,
            step: '0.5',
            max: MOVE_ACCELERATION.z.toString(),
            min: '0',
          })}
          <label>Forward Deceleration</label>
          ${createSlider({
            valueSignal: forwardDeceleration,
            step: '0.5',
            max: '10',
            min: '0',
            isNegative: 'true',
          })}
        </div>
      </div>
    `);
  }
}

export const createPlayerHUD = (params: PlayerHUDProps) => /* HTML */ `<${playerHudTag}
    ${tagOptions<PlayerHUDTag>(params)}
  ></${playerHudTag}> `;
