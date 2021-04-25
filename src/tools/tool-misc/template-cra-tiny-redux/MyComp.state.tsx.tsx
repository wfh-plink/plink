/**
 * For those components which has complicated "state" or a lot async "actions",
 * leverage a Redux (Redux-toolkit, Redux-observable) like internal store to manage
 * your component.
 * 
 * It's more powerful than React's useReducer() (https://reactjs.org/docs/hooks-reference.html#usereducer)
 * 
 * You should be familiar with concept of "slice" (Redux-toolkit) and "Epic" (Redux-observable) first.
 * 
 * Unlike real Redux-toolkit, we does not use ImmerJs inside, its your job to take care of
 * immutabilities of state, but also as perks, you can use any ImmerJS unfriendly object in state,
 * e.g. DOM object, React Component, functions
 */
import {EpicFactory, ofPayloadAction} from '@wfh/redux-toolkit-observable/es/tiny-redux-toolkit-hook';
import * as op from 'rxjs/operators';
import * as rx from 'rxjs';

export type $__MyComponent__$Props = React.PropsWithChildren<{
  // define component properties
}>;
export interface $__MyComponent__$State {
  componentProps?: $__MyComponent__$Props;
  yourStateProp?: React.MouseEvent['target'];
  error?: Error;
}

const reducers = {
  onClick(s: $__MyComponent__$State, event: React.MouseEvent) {},

  changeYourStateProp(s: $__MyComponent__$State, value: React.MouseEvent['target']) {
    s.yourStateProp = value;
  },
  _syncComponentProps(s: $__MyComponent__$State, payload: $__MyComponent__$Props) {
    s.componentProps = {...payload};
  }
  // define more reducers...
};

export function sliceOptionFactory() {
  const initialState: $__MyComponent__$State = {};
  return {
    name: '$__MyComponent__$',
    initialState,
    reducers,
    debug: process.env.NODE_ENV !== 'production'
  };
}

export const epicFactory: EpicFactory<$__MyComponent__$State, typeof reducers> = function(slice) {
  return (action$) => {
    return rx.merge(
      // Observe state (state$) change event, exactly like React.useEffect(), but more powerful for async time based reactions
      slice.getStore().pipe(
        op.map(s => s.componentProps), // watch component property changes
        op.filter(props => props != null),
        op.distinctUntilChanged(), // distinctUntilChanged accept an expression as parameter
        op.tap(() => {
          // slice.actionDispatcher....
        })
      ),
      // Observe incoming action 'onClick' and dispatch new change action
      action$.pipe(ofPayloadAction(slice.actions.onClick),
        op.switchMap((action) => {
          // mock async job
          return Promise.resolve(action.payload.target); // Promise is not cancellable, the better we use observables instead promise here
        }),
        op.tap(dom => slice.actionDispatcher.changeYourStateProp(dom))
      )
      // ... more action async reactors: action$.pipe(ofType(...))
    ).pipe(op.ignoreElements());
  };
};

/**
 * Below is how you use slice inside your component:

import React from 'react';
import {useTinyReduxTookit} from '@wfh/redux-toolkit-observable/es/tiny-redux-toolkit-hook';
import {sliceOptionFactory, epicFactory, $__MyComponent__$Props} from './$__sliceName__$.state';
export {$__MyComponent__$Props};

const $__MyComponent__$: React.FC<$__MyComponent__$Props> = function(props) {
  const [state, slice] = useTinyReduxTookit(sliceOptionFactory, epicFactory);

  React.useEffect(() => {
    slice.actionDispatcher._syncComponentProps(props);
  }, [...Object.values(props)]);
  // dispatch action: slice.actionDispatcher.onClick(evt)
  return <div onClick={slice.actionDispatcher.onClick}>{state}</div>;
};

export {$__MyComponent__$};

 */
