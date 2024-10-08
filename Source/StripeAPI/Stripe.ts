/**
 * @copyright 2022 Myers-Holum Inc.
 * @author
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

import {StripeConstructorOptions, Stripe_Setup} from '../Record/Stripe_Setup';
import {StripeAPI} from './StripeAPI';
import {Stripe_Bundles_Configuration} from '../Record/Stripe_Bundles_Configuration';

export class Stripe {
    private readonly stripeAPI: StripeAPI;
    private readonly stripeSetup: Stripe_Setup;
    private readonly stripeBundlesConfiguration: Stripe_Bundles_Configuration;
    constructor(options?: StripeConstructorOptions) {
        this.stripeBundlesConfiguration = new Stripe_Bundles_Configuration();
        this.stripeSetup = new Stripe_Setup(options);
        this.stripeAPI = new StripeAPI(this.stripeSetup);
    }

    get BUNDLESCONFIGURATION(): Stripe_Bundles_Configuration {
        return this.stripeBundlesConfiguration;
    }
    get SETUP(): Stripe_Setup {
        return this.stripeSetup;
    }

    get API(): StripeAPI {
        return this.stripeAPI;
    }
}
