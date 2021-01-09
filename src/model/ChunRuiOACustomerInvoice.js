zn.define(function () {

    return zn.Model("zn_chunrui_oa_customer_invoice", {
        mixins: [
            zn.db.common.model.Base
        ],
        properties: {
            status: {
                value: null,
                type: ['int', 11],
                default: 0
            },
            customer_id: {
                value: null,
                type: ['int', 11],
                default: 0
            },
            count: {
                value: null,
                type: ['decimal', [10,2]],
                default: 0
            },
            sum: {
                value: null,
                type: ['decimal', [10,2]],
                default: 0
            },
            invoice_batch: {
                value: null,
                type: ['varchar', 100],
                default: ''
            },
            invoice_no: {
                value: null,
                type: ['varchar', 100],
                default: ''
            },
            invoice_create_time: {
                value: null,
                type: ['date'],
                default: null
            },
            title: {
                value: null,
                type: ['varchar', 100],
                default: ''
            },
            tax_id: {
                value: null,
                type: ['varchar', 100],
                default: ''
            },
            consignee: {
                value: null,
                type: ['varchar', 100],
                default: ''
            },
            consignee_phone: {
                value: null,
                type: ['varchar', 100],
                default: ''
            },
            consignee_address: {
                value: null,
                type: ['varchar', 500],
                default: ''
            },
            express_company: {
                value: null,
                type: ['varchar', 100],
                default: ''
            },
            express_code: {
                value: null,
                type: ['varchar', 100],
                default: ''
            },
            express_state: {
                value: null,
                type: ['int', 11],
                default: -1
            },
            express_data: {
                value: null,
                type: ['varchar', 2000],
                default: ''
            },
            express_sum: {
                value: null,
                type: ['varchar', 100],
                default: ''
            },
            order_ids: {
                value: null,
                type: ['varchar', 500],
                default: ''
            },
            files: {
                value: null,
                type: ['varchar', 1000],
                default: ','
            }
        }
    });

})
