const path = require('path')
const pluralize = require('pluralize');
let PluginTitle = 'CircularDependencyPluginAsync'
const chalk = require('chalk');
const workerFarm = require('worker-farm');
const findCircularDependencies = require('./findCircularDependencies');
const fs = require('fs');

function printFindings(circular, snapshotPath, logger, threshold) {
    const snapshotJson = getCurrentCircularDependenciesSnapshot(snapshotPath).map(snapshotItem => JSON.stringify(snapshotItem));
    const currentNumberOfCircularDependencies = threshold ?? snapshotJson.length ?? 0;

    const newNumberOfCicularDependencies = Object.keys(circular).length;

    const introducedNumberOfCicularDependencies = newNumberOfCicularDependencies - currentNumberOfCircularDependencies;

    if (introducedNumberOfCicularDependencies > 0) {

        let error = chalk.red.bold(`Found ${pluralize('circular dependency', introducedNumberOfCicularDependencies, true)}:\n`);

        for (let index = 0; index < circular.length; index++) {
            const modulePath = circular[index];

            if (snapshotJson.includes(JSON.stringify(modulePath))) {
                continue;
            } else {
                modulePath.forEach((module, index) => {
                    if (index > 0) {
                        error = error.concat(chalk.dim(' > '));
                    }
                    error = error.concat(chalk.red.bold(module));
                });
                error = error.concat('\n');
            }
        }
        logger.error(error);
    } else {
        logger.info(chalk.green(`No circular dependencies found.\n`));
    }
};

class Logger {
    constructor({ onError, onInfo }) {
        this.onError = onError;
        this.onInfo = onInfo;
    }

    error(errorMessage) {
        this.onError(errorMessage);
    }

    info(infoMessage) {
        this.onInfo(infoMessage);
    }
}

class CircularDependencyPluginAsync {
    constructor(options = {}) {
        this.workerId = 0;
        this.workerFarm = null;

        this.isAsync = options.isAsync ?? false;
        this.indexFilePath = options.indexFilePath ?? './src/index.js';
        this.snapshotPath = options.snapshotPath ?? null;
        this.threshold = options.threshold ?? 0;
    }

    apply(compiler) {
        if (this.isAsync) {
            this.runAsync(compiler);
        } else {
            this.run(compiler);
        }
    }

    runAsync(compiler) {
        // inspiration https://github.com/webpack-contrib/uglifyjs-webpack-plugin/blob/master/src/TaskRunner.js#L45
        this.workerFarm = workerFarm(require.resolve('./worker'));
        const logger = new Logger({ onError: (errorMessage) => process.stderr.write(errorMessage), onInfo: (infoMessage) => process.stdout.write(infoMessage) })

        compiler.hooks.shutdown.tap(PluginTitle, () => {
            workerFarm.end(this.workerFarm);
        })

        compiler.hooks.done.tap(PluginTitle, async () => {
            if (this.workerId > 1000) {
                this.workerId = 0;
            }

            // inspiration https://github.com/TypeStrong/fork-ts-checker-webpack-plugin/blob/26a81edca9c7d9abada1e76e76fb978f903f97a3/src/hooks/tap-done-to-async-get-issues.ts#L38
            setTimeout(() => { logger.info(chalk.cyan("\nFinding circular dependencies...\n")) }, 30)

            this.workerId++;

            this.workerFarm({ workerId: this.workerId, path: this.getPathToIndex() }, (err, result) => {
                if (this.workerId === result.workerId) {
                    printFindings(result.output, this.getPathToSnapshot(), logger, this.threshold);
                }
            })
        })
    }

    run(compiler) {
        compiler.hooks.afterEmit.tapPromise(PluginTitle, async (compilation) => {
            const output = await findCircularDependencies(this.getPathToIndex());
            const logger = new Logger({ onError: (errorMessage) => compilation.errors.push(errorMessage), onInfo: (infoMessage) => {} } )  
            printFindings(output, this.getPathToSnapshot(), logger, this.threshold)
        })
    }

    getPathToIndex() {
        return path.relative(process.cwd(), this.indexFilePath);
    }

    getPathToSnapshot() {
        return this.snapshotPath ? path.relative(process.cwd(), this.snapshotPath) : null;
    }

}

function getCurrentCircularDependenciesSnapshot(snapshotPath) {
    return JSON.parse(snapshotPath ? fs.readFileSync(snapshotPath, 'utf8') : '[]');
};


module.exports = CircularDependencyPluginAsync
