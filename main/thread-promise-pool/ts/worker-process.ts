// tslint:disable no-console

let verbose = false;

process.on('uncaughtException', function(err) {
  // log.error('Uncaught exception', err, err.stack);
  console.error(`[thread-pool] pid:${process.pid} Uncaught exception: `, err);
  process.send!({
    type: 'error',
    data: err.toString()
  });
});

process.on('unhandledRejection', err => {
  // log.warn('unhandledRejection', err);
  console.error(`[thread-pool] pid:${process.pid} unhandledRejection`, err);
  process.send!({
    type: 'error',
    data: err ? err.toString() : err
  });
});

export interface InitialOptions {
  verbose?: boolean;
  /** After worker being created, the exported function will be run,
   * You can put any initial logic in it, like calling `require('source-map-support/register')` or
   * setup process event handling for uncaughtException and unhandledRejection.
   */
  initializer?: {file: string; exportFn?: string};
}
export interface Task {
  file: string;
  /**
   * A function which can return Promise or non-Promise value
   */
  exportFn?: string;
  args?: any[];
}

export interface Command {
  exit: boolean;
}

if (process.send) {
  process.on('message', executeOnEvent);
}

async function executeOnEvent(data: Task | Command) {
  if ((data as Command).exit) {
    if (verbose)
      console.log(`[thread-pool] child process ${process.pid} exit`);
    process.exit(0);
    return;
  }

  if ((data as InitialOptions).verbose != null) {
    verbose = !!(data as InitialOptions).verbose;
  }

  try {
    let result: any;
    const initData = data as InitialOptions;
    if (initData.initializer) {
      if (verbose) {
        console.log(`[thread-pool] child process ${process.pid} init`);
      }
      const exportFn = initData.initializer.exportFn;
      if (exportFn) {
        await Promise.resolve(require(initData.initializer.file)[exportFn]());
      } else {
        require(initData.initializer.file);
      }
    } else {
      if (verbose) {
        console.log(`[thread-pool] child process ${process.pid} run`);
      }
      const exportFn = (data as Task).exportFn;

      if (exportFn) {
        result =  await Promise.resolve(require((data as Task).file)[exportFn](
          ...((data as Task).args || [])
          ));
      } else {
        require((data as Task).file);
      }
    }

    if (verbose) {
      console.log(`[thread-pool] child process ${process.pid} wait`);
    }
    process.send!({ type: 'wait', data: result });

  } catch (ex) {
    console.log(`[thread-pool] child process ${process.pid} error`, ex);
    try {
      process.send!({
        type: 'error',
        data: ex.toString()
      });
    } catch (err) {
      process.send!({
        type: 'error',
        data: err.toString()
      });
    }
  }
}
