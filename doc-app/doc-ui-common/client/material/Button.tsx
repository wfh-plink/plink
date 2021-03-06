import React from 'react';

import classnames from 'classnames/bind';
import cls from 'classnames';
import styles from './Button.module.scss';
// import * as rx from 'rxjs';
// import * as op from 'rxjs/operators';
import {Ripple, RippleProps} from './Ripple';

const cx = classnames.bind(styles);

export type ButtonProps = React.PropsWithChildren<{
  onClick?(evt: any): void;
  type?: 'raised' | 'outlined' | 'text';
  /** Not working ! */
  isDialogDefaultAction?: boolean;
  disabled?: boolean;
  // materialIcon?: string;
  className?: string;
  rippleColor?: RippleProps['color'];
  materialIcon?: string;
  dialogAction?: string;
  // materialIconStyle?: 'regular' | 'outlined' | 'towtone'
}>;

interface ButtonState {
  btnDom?: HTMLButtonElement;
  outerDom?: HTMLDivElement;
}


const Button: React.FC<ButtonProps> = function(props) {
  const [state, setState] = React.useState<ButtonState>({});

  const onRef = React.useCallback((btn: HTMLButtonElement | null) => {
    if (btn) {
      setState(s => ({...s, btnDom: btn}));
    }
  }, []);

  const onOuterRef = React.useCallback((btn: HTMLDivElement | null) => {
    if (btn) {
      setState(s => ({...s, outerDom: btn}));
    }
  }, []);

  React.useEffect(() => {
    if (state.btnDom) {
      if (props.disabled === true) {
        state.btnDom.setAttribute('disabled', '');
      } else {
        state.btnDom.removeAttribute('disabled');
      }
    }
  }, [props.disabled, state.btnDom]);

  React.useEffect(() => {
    if (state.outerDom) {
      if (props.isDialogDefaultAction) {
        state.outerDom.setAttribute('data-mdc-dialog-button-default', 'true');
      } else {
        state.outerDom.removeAttribute('data-mdc-dialog-button-default');
      }
    }
  }, [props.isDialogDefaultAction, state.outerDom]);

  React.useEffect(() => {
    if (state.btnDom) {
      if (props.dialogAction) {
        state.btnDom.setAttribute('data-mdc-dialog-action', props.dialogAction);
      } else {
        state.btnDom.removeAttribute('data-mdc-dialog-action');
      }
    }
  }, [props.dialogAction, state.btnDom]);

  const clickCb = React.useCallback<React.MouseEventHandler<HTMLButtonElement>>((event) => {
    if (props.onClick) {
      props.onClick(event);
    }
  }, [props]);

  const className = cx('mdc-button',
    'mdc-button--' + (props.type == null || props.type === 'text' ? '' : props.type),
    'mdc-button--touch');


  return (
    <div ref={onOuterRef}
      className={cls(props.className, cx('mdc-touch-target-wrapper', 'matButton', {'mdc-button--icon-leading': !!props.materialIcon}))}>
      <button ref={onRef} className={className} onClick={clickCb}>
        {props.materialIcon ? (
          <i className={classnames('material-icons', styles['mdc-button__icon'], 'md-' + props.materialIcon)} aria-hidden='true'></i>
        ) : null}
        <span className={cx('mdc-button__label')}>{props.children}</span>
        <span className={cx('mdc-button__touch')}></span>
        <Ripple className={cls(props.type === 'raised' ? 'raised-btn' : '')} color={props.rippleColor}></Ripple>
      </button>
    </div>
    );
};


export {Button};



