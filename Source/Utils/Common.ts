/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

import * as runtime from 'N/runtime';
import * as search from 'N/search';
import * as url from 'N/url';
import * as file from 'N/file';
import * as CryptoJS from './crypto-js';
import { TextValue } from 'Source/Record/CustomRecord';

// Function to check if the current Netsuite environment is a Production Environment
export const isProduction = (): boolean  => {
    let isProduction = false;

    // Check if environment type is production
    if (runtime.envType === runtime.EnvType.PRODUCTION) {
        isProduction = true;
    }

    return isProduction;
};

// Get Current Netsuite Account ID
export const getAccountId = (): string  => {

    return runtime.accountId.replace('_', '-').toLowerCase();
};

// Get Current Stripe Link
export const getStripeLink = (domain: string, id: string): string  => {
    let url = `https://dashboard.stripe.com/`;
    if (!isProduction()) {
        url += `test/`;
    }
    url += `${domain}/${id}`;

    return url;
};

// Get the Stripe Portal Field
export const getStripePortalField = (recordType?): string  => {

    let paymentPortalField = null;
    switch (recordType) {
        case 'invoicegroup':
            paymentPortalField = 'custrecord_mhi_stripe_payment_portal';
            break;
        case 'customer': case 'partner':
            paymentPortalField = 'custentity_mhi_stripe_payment_portal';
            break;
        default:
            paymentPortalField = 'custbody_mhi_stripe_payment_portal';
            break;
    }

    return paymentPortalField;
};

export const getTransactionDetails = (options: GetTransactionDetailsOptions): TransactionDetails => {
    let transactionDetails: TransactionDetails;

    if (+options.transactionId > 0) {

        search.create({
            type: search.Type.TRANSACTION,
            filters:
                [
                    ['internalidnumber', 'equalto', options.transactionId]
                ],
            columns:  [
                'entity',
                'currency',
                'fxamountremaining',
                'subsidiary',
                'transactionname',
                'fxamount',
                'custbody_stripe_chargeid',
                'createdfrom.custbody_stripe_payment_intentid',
                'customer.custentity_mhi_stripeid',
                search.createColumn({
                    name: 'formulanumeric',
                    formula: 'CASE WHEN {recordType} = \'invoice\' THEN {fxamountremaining} WHEN  {recordType} = \'salesorder\' THEN {fxamountunbilled} ELSE {fxamount} END',
                    label: 'amountremaining'
                })
            ]
        }).run().each(result => {

            transactionDetails = {
                internalid: +result.id,
                recordtype: <string>result.recordType,
                transactionname: <string> result.getValue('transactionname'),
                entity: {
                    value: <string> result.getValue('entity'),
                    text: result.getText('entity')
                },
                currency: {
                    value: <string> result.getValue('currency'),
                    text: result.getText('currency')
                },
                subsidiary: {
                    value: <string> result.getValue('subsidiary'),
                    text: result.getText('subsidiary')
                },
                amountremaining: +result.getValue(search.createColumn({
                    name: 'formulanumeric',
                    formula: 'CASE WHEN {recordType} = \'invoice\' THEN {fxamountremaining} WHEN  {recordType} = \'salesorder\' THEN {fxamountunbilled} ELSE {fxamount} END',
                    label: 'amountremaining'
                })),
                amount: Math.abs(+result.getValue('fxamount')),
                chargeid: <string> result.getValue('custbody_stripe_chargeid'),
                payment_intentid: <string> result.getValue({name: 'custbody_stripe_payment_intentid' , join: 'createdfrom'}),
                customerstripeid: <string> result.getValue({name: 'custentity_mhi_stripeid', join: 'customer'})
            };
            return false;
        });
    }

    return transactionDetails;
};

export const getInvoiceGroupDetails = (options: GetTransactionDetailsOptions): TransactionDetails => {
    let transactionDetails: TransactionDetails;

    if (+options.transactionId > 0) {

        search.create({
            type: search.Type.INVOICE_GROUP,
            filters:
                [
                    ['internalidnumber', 'equalto', options.transactionId]
                ],
            columns:  [
                'customer',
                'currency',
                'subsidiary',
                'invoicegroupnumber',
                'fxamount',
                'fxamountdue',
                'custrecord_stripe_payment_intentid',
                'custrecord_stripe_chargeid',

            ]
        }).run().each(result => {

            transactionDetails = {
                internalid: +result.id,
                recordtype: <string>result.recordType,
                transactionname: <string> result.getValue('invoicegroupnumber'),
                entity: {
                    value: <string> result.getValue('customer'),
                    text: result.getText('customer')
                },
                currency: {
                    value: <string> result.getValue('currency'),
                    text: result.getText('currency')
                },
                subsidiary: {
                    value: <string> result.getValue('subsidiary'),
                    text: result.getText('subsidiary')
                },
                amountremaining: +result.getValue('fxamountdue'),
                amount: Math.abs(+result.getValue('fxamount')),
                chargeid: <string> result.getValue('custrecord_stripe_chargeid'),
                payment_intentid: <string> result.getValue({name: 'custrecord_stripe_payment_intentid'}),
                customerstripeid: ''
            };
            return false;
        });
    }

    return transactionDetails;
};

export const getEntityDetails = (options: GetEntityDetailsOptions): EntityDetails => {
    let entityDetails: EntityDetails;

    if (+options.entityId > 0) {

        search.create({
            type: search.Type.CUSTOMER,
            filters:
                [
                    ['internalidnumber', 'equalto', options.entityId],
                    'AND',
                    ['isinactive', 'is', 'F']
                ],
            columns: [
                'companyname',
                'entityid',
                'subsidiary',
                'custentity_mhi_stripe_payment_expiry',
                'email',
                'custentity_mhi_stripe_pincode',
                'custentity_mhi_stripeid'

            ]
        }).run().each(result => {
            entityDetails = {
                internalid: +result.id,
                recordtype: <string>result.recordType,
                subsidiary: +result.getValue('subsidiary'),
                name: <string>(result.getValue('companyname') || result.getValue('altname')),
                email: <string>result.getValue('email'),
                expiry: <string>result.getValue('custentity_mhi_stripe_payment_expiry'),
                pin: <string>result.getValue('custentity_mhi_stripe_pincode'),
                netsuiteStripeId: <string>result.getValue('custentity_mhi_stripeid')
            };
            return false;
        });
    }

    return entityDetails;
};

export const getInstallmentEntityDetails = (options: GetEntityDetailsOptions): InstallmentEntityDetails => {
    let entityDetails: InstallmentEntityDetails;

    if (+options.entityId > 0) {

        search.create({
            type: search.Type.CUSTOMER,
            filters:
                [
                    ['internalidnumber', 'equalto', options.entityId],
                    'AND',
                    ['isinactive', 'is', 'F']
                ],
            columns: [
                'companyname',
                'entityid',
                'subsidiary'

            ]
        }).run().each(result => {
            entityDetails = {
                internalid: +result.id,
                recordtype: <string>result.recordType,
                subsidiary: +result.getValue('subsidiary'),
                name: <string>(result.getValue('companyname') || result.getValue('altname'))
            };
            return false;
        });
    }

    return entityDetails;
};

export const getCurrencyCode = (currencyId: number): string => {

    let currencyCode = 'USD';

    if (+currencyId > 0) {
        search.create({
            type: search.Type.CURRENCY,
            filters:
                [
                    ['internalidnumber', 'equalto', currencyId]
                ],
            columns:
                [
                    'symbol'
                ]
        }).run().each(result => {
            currencyCode = <string> result.getValue('symbol');
            return false;
        });
    }
    return currencyCode;
};

const SECRET = 'Sd4y5';

export const encode = (plainText): string  => {
    let eHex = '';
    try {
        const b64 = CryptoJS.AES.encrypt(plainText, SECRET).toString();
        const e64 = CryptoJS.enc.Base64.parse(b64);
        eHex = e64.toString(CryptoJS.enc.Hex);
    } catch (e) {

    }
    return eHex;
};

export const decode = (cipherText): string  => {
    let plain = '';
    try {
        const reb64 = CryptoJS.enc.Hex.parse(cipherText);
        const bytes = reb64.toString(CryptoJS.enc.Base64);
        const decrypt = CryptoJS.AES.decrypt(bytes, SECRET);
        plain = decrypt.toString(CryptoJS.enc.Utf8);
    } catch (e) {

    }
    return plain;
};

export const parseQueryString = query => {
    const vars = query.split('&');
    const queryObject: QueryObject = {};
    for (let i = 0; i < vars.length; i += 1) {
        const pair = vars[i].split('=');
        const key = decodeURIComponent(pair.shift());
        const value = decodeURIComponent(pair.join('='));
        // If first entry with this name
        if (typeof queryObject[key] === 'undefined') {
            queryObject[key] = value;
            // If second entry with this name
        } else if (typeof queryObject[key] === 'string') {
            const arr = [queryObject[key], value];
            queryObject[key] = arr;
            // If third or later entry with this name
        } else {
            queryObject[key].push(value);
        }
    }
    return queryObject;
};

export const getFileContent = (options: GetFileContentOptions): void => {

    // Load the HTML
    search.create({
        type: 'file',
        filters:
            [
                ['name', 'is', `${options.fileName}`]
            ]
    }).run().each(result => {
        const fileObj = file.load({id: +result.id});

        options.Found(fileObj.getContents());
        return false;
    });

    options.NotFound();
};

export const redirectToScript = (params): string  => {

    const paramString = Object.keys(params).map(key => `${key}=${params[key]}`).join('&');

    const externalURL = url.resolveScript({
        scriptId: 'customscript_mhi_stripe_payment_portal',
        deploymentId: 'customdeploy_mhi_stripe_payment_portal',
        params: params,
        returnExternalUrl: true
    });

    return `${externalURL}`;
};

export const isDirectRevenuePosting = (itemId: number): boolean => {

    let isDirectPosting = false;
    try {
        if (+itemId > 0) {
            search.create({
                type: search.Type.ITEM,
                filters:
                    [
                        ['internalidnumber', 'equalto', itemId]
                    ],
                columns:
                    [
                        'directrevenueposting'
                    ]
            }).run().each(result => {
                isDirectPosting = <boolean>result.getValue('directrevenueposting');
                return false;
            });
        }

    } catch (err) {}
    return isDirectPosting;
};

export const isPaymentCreditChargeExcluded = (transactionId: number, recordType?: string): boolean => {

    let isExcluded = false;
    try {
        if (+transactionId > 0) {
            search.create({
                type: search.Type.TRANSACTION,
                filters:
                    [
                        ['internalidnumber', 'equalto', transactionId]
                    ],
                columns:
                    [
                        'custbody_mhi_stripe_exclude_cc_fee'
                    ]
            }).run().each(result => {
                isExcluded = <boolean>result.getValue('custbody_mhi_stripe_exclude_cc_fee');
                return false;
            });
        }

    } catch (err) {

    }

    return isExcluded;
};

export interface GetFileContentOptions {
    fileName: string;
    Found(fileContent: string): void;
    NotFound(): void;
}

export interface GetTransactionDetailsOptions {
    transactionId: number;
}

export interface TransactionDetails {
    internalid: number;
    recordtype: string;
    transactionname: string;
    entity: TextValue;
    currency: TextValue;
    subsidiary: TextValue;
    amountremaining: number;
    amount: number;
    chargeid: string;
    payment_intentid: string;
    customerstripeid: string;
}

export interface QueryObject {
    a?: string;
    b?: number;
    c?: number;
    d?: string;
    e?: number;
    f?: string;
    g?: string;
    p?: string;
    t?: string;
}

export interface GetEntityDetailsOptions {
    entityId: number;
}

export interface EntityDetails {
    internalid: number;
    recordtype: string;
    name: string;
    expiry: string;
    email: string;
    pin: string;
    subsidiary: number;
    netsuiteStripeId: string;
}

export interface InstallmentEntityDetails {
    internalid: number;
    recordtype: string;
    name: string;
    subsidiary: number;
}
