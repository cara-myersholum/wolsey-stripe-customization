/**
 * @copyright 2022 Myers-Holum Inc.

 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 * @NScriptType Suitelet
 */

import {EntryPoints} from 'N/types';
import * as https from 'N/https';
import * as record from 'N/record';
import * as http from 'N/http';
import * as url from 'N/url';
import * as log from 'N/log';
import {encode} from '../Utils/Common';

export const onRequest: EntryPoints.Suitelet.onRequest = (context: EntryPoints.Suitelet.onRequestContext) => {

    switch (context.request.method) {
        case https.Method.GET:
        case https.Method.POST:
            // Check the parameters passed
            const parameters = context.request.parameters;
            const recordId = +parameters.id;
            const recordType = parameters.type;
            // If a customerId is present in the parameters
            if (recordId > 0) {
                try {
                    // Load the record
                    const netsuiteRecord = record.load({
                        type: recordType,
                        id: recordId,
                        isDynamic: true
                    });

                    // Assign ID and type as parameter
                    const params = `a=${recordId}&t=${recordType}`;

                    // Generate Payment Link for the portal suitelet
                    const externalURL = url.resolveScript({
                        scriptId: 'customscript_mhi_stripe_payment_portal',
                        deploymentId: 'customdeploy_mhi_stripe_payment_portal',
                        params: {p: encode(params)},
                        returnExternalUrl: true
                    });

                    // Set the payment portal link
                    netsuiteRecord.setValue({fieldId: 'custentity_mhi_stripe_payment_portal', value: externalURL});
                    // Save the customer record
                    netsuiteRecord.save({ignoreMandatoryFields: true});
                } catch (err) {
                    log.debug('err', err);
                }

                // Redirect back to customer
                context.response.sendRedirect({type: http.RedirectType.RECORD, identifier: `${recordType}`, id: `${recordId}`, parameters: {link: true}});

            }

            break;
        default:
            break;
    }

};
