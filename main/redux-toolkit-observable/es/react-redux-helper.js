import React from 'react';
import { stateFactory, ofPayloadAction } from './state-factory-browser';
import { createSliceHelper, createReducers } from './helper';
import { useEffect, useState } from 'react';
import * as rx from 'rxjs';
import * as op from 'rxjs/operators';
let COMPONENT_ID = 0;
export { ofPayloadAction, createReducers };
export function useReduxTookit(optsFactory, epicFactory) {
    const willUnmountSub = React.useMemo(() => new rx.ReplaySubject(1), []);
    const sliceOptions = React.useMemo(optsFactory, []);
    const [state, setState] = React.useState(sliceOptions.initialState);
    const helper = React.useMemo(() => {
        const helper = createSliceHelper(stateFactory, Object.assign(Object.assign({}, sliceOptions), { name: sliceOptions.name + '.' + COMPONENT_ID++ }));
        stateFactory.sliceStore(helper).pipe(op.distinctUntilChanged(), op.tap(changed => setState(changed)), op.takeUntil(willUnmountSub)).subscribe();
        // Important!!
        // Epic might contain recurive state changing logic, like subscribing on state$ stream and 
        // change state, it turns out any subscriber that subscribe state$ later than
        // epic will get a state change event in reversed order !! So epic must be the last one to
        // subscribe state$ stream
        if (epicFactory) {
            helper.setEpic(epicFactory);
        }
        return helper;
    }, []);
    React.useEffect(() => {
        return () => {
            willUnmountSub.next();
            willUnmountSub.complete();
            helper.destroy();
        };
    }, []);
    return [state, helper];
}
export function useStoreOfStateFactory(stateFactory) {
    const [reduxStore, setReduxStore] = useState(undefined);
    useEffect(() => {
        stateFactory.store$.subscribe({
            next(store) {
                setReduxStore(store);
            }
        });
    }, [stateFactory.getRootStore()]);
    return reduxStore;
}
