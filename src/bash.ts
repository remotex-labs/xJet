#!/usr/bin/env node

/**
 * Imports
 */

import '@errors/uncaught.error';
import { parseArguments } from '@providers/cli.provider';
import { SuitesService } from '@services/suites.service';
import { bannerComponent } from '@components/banner.component';
import { configuration } from '@providers/configuration.provider';

/**
 * Main entry point for the xJet library.
 *
 * @since 1.0.0
 */

async function main(argv: Array<string>): Promise<void> {
    const cli = await parseArguments(argv);
    if (cli.verbose) globalThis.VERBOSE = true;

    const config = await configuration(cli.config, cli);
    if (config.verbose) globalThis.VERBOSE = true;

    if (![ 'json', 'junit' ].includes(config.reporter)) {
        console.log(bannerComponent());
    } else {
        globalThis.NO_COLOR = true;
    }

    const suites = new SuitesService(config);
    await suites.executeSuites();
}

/**
 * Run entrypoint of xJet cli
 */

main(process.argv);
