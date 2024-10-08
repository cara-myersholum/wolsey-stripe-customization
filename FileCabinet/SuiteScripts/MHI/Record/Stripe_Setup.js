/**
 * @copyright 2022 Myers-Holum Inc.
 * @author
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 */
define(["require", "exports", "N/search", "./CustomRecord", "../Utils/Common"], function (require, exports, search, CustomRecord_1, Common_1) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Stripe_Setup = void 0;
    // This is the class used to load the Stripe Setup Custom Record
    class Stripe_Setup extends CustomRecord_1.CustomRecord {
        constructor(options) {
            super(Stripe_Setup.RECORDID);
            // If no subsidiary is passed, just search for the first one we get using search
            if (!options) {
                search.create({
                    type: Stripe_Setup.RECORDID,
                    filters: ['isinactive', 'is', 'F']
                }).run().each(result => {
                    this.recordId = +result.id;
                    return true;
                });
            }
            else if (options.id) {
                // If subsidiary is passed, use the setup mapped to that subsidiary
                search.create({
                    type: Stripe_Setup.RECORDID,
                    filters: [['isinactive', 'is', 'F'], 'AND', ['internalid', 'anyof', options.id]]
                }).run().each(result => {
                    this.recordId = +result.id;
                    return true;
                });
            }
            else if (options.subsidiary) {
                // If subsidiary is passed, use the setup mapped to that subsidiary
                search.create({
                    type: Stripe_Setup.RECORDID,
                    filters: [['isinactive', 'is', 'F'], 'AND', ['custrecord_mhi_setup_subsidiary', 'anyof', options.subsidiary]]
                }).run().each(result => {
                    this.recordId = +result.id;
                    return true;
                });
            }
            if (+this.recordId > 0) {
                // Check if record id was got
            }
        }
        // Get the Application ID
        get appid() {
            var _a, _b;
            return (0, Common_1.isProduction)() ? (_a = this.RecordValues) === null || _a === void 0 ? void 0 : _a.custrecord_mhi_setup_appid : (_b = this.RecordValues) === null || _b === void 0 ? void 0 : _b.custrecord_mhi_setup_appid_sb;
        }
        // Get the Secret ID
        get secret() {
            var _a, _b;
            return (0, Common_1.isProduction)() ? (_a = this.RecordValues) === null || _a === void 0 ? void 0 : _a.custrecord_mhi_setup_secret : (_b = this.RecordValues) === null || _b === void 0 ? void 0 : _b.custrecord_mhi_setup_secret_sb;
        }
        // Get the Secret ID
        get subsidiary() {
            var _a;
            return +((_a = this.RecordValues) === null || _a === void 0 ? void 0 : _a.custrecord_mhi_setup_subsidiary[0].value);
        }
        // Get the Webhook ID
        get webhook() {
            var _a;
            return (_a = this.RecordValues) === null || _a === void 0 ? void 0 : _a.custrecord_mhi_setup_webhook;
        }
        set webhookId(id) {
            this.setFieldValue({ custrecord_mhi_setup_webhook: id });
        }
        // Get the Field IDs
        get Lookup() {
            return search.lookupFields({
                id: this.recordId,
                type: Stripe_Setup.RECORDID,
                columns: ['custrecord_mhi_setup_subsidiary',
                    'custrecord_mhi_setup_acctid',
                    'custrecord_mhi_setup_secret',
                    'custrecord_mhi_setup_appid',
                    'custrecord_mhi_setup_appid_sb',
                    'custrecord_mhi_setup_secret_sb',
                    'custrecord_mhi_setup_webhook'
                ]
            });
        }
        static getAllSetupIds() {
            let setupIds = [];
            try {
                search.create({
                    type: Stripe_Setup.RECORDID,
                }).run().each(result => {
                    setupIds.push(+result.id);
                    return true;
                });
            }
            catch (err) {
            }
            return setupIds;
        }
    }
    exports.Stripe_Setup = Stripe_Setup;
    // Declare the record id
    Stripe_Setup.RECORDID = 'customrecord_mhi_stripe_setup';
});
