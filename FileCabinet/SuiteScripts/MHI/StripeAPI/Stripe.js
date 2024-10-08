/**
 * @copyright 2022 Myers-Holum Inc.
 * @author
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 */
define(["require", "exports", "../Record/Stripe_Setup", "./StripeAPI", "../Record/Stripe_Bundles_Configuration"], function (require, exports, Stripe_Setup_1, StripeAPI_1, Stripe_Bundles_Configuration_1) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Stripe = void 0;
    class Stripe {
        constructor(options) {
            this.stripeBundlesConfiguration = new Stripe_Bundles_Configuration_1.Stripe_Bundles_Configuration();
            this.stripeSetup = new Stripe_Setup_1.Stripe_Setup(options);
            this.stripeAPI = new StripeAPI_1.StripeAPI(this.stripeSetup);
        }
        get BUNDLESCONFIGURATION() {
            return this.stripeBundlesConfiguration;
        }
        get SETUP() {
            return this.stripeSetup;
        }
        get API() {
            return this.stripeAPI;
        }
    }
    exports.Stripe = Stripe;
});
