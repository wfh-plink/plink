import { StateFactory, ofPayloadAction } from '../../redux-toolkit-observable/dist/redux-toolkit-observable';
export { ofPayloadAction };
/**
 * Since Redux-toolkit does not read initial state with any lazy slice that has not defined in root reducer,
 * e.g.
 * "Unexpected keys "clean", "packages" found in preloadedState argument passed to createStore.
 * Expected to find one of the known reducer keys instead: "main". Unexpected keys will be ignored.""
 *
 * I have to export saved state, so that eacy lazy slice can initialize its own slice state by themself
 */
export declare const lastSavedState: any;
export declare const stateFactory: StateFactory;
export declare function startLogging(): Promise<void>;
/**
 * Call this function before you explicitly run process.exit(0) to quit, because "beforeExit"
 * won't be triggered prior to process.exit(0)
 */
export declare function saveState(): Promise<void>;
