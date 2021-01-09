zn.define(function (pinyin) {

    return zn.Model("zn_chunrui_oa_express_company", {
        mixins: [
            zn.db.common.model.Base
        ],
        properties: {
            code: {
                value: null,
                type: ['varchar', 100],
                default: ''
            },
            title: {
                value: null,
                type: ['varchar', 100],
                default: ''
            },
            service_hotline: {
                value: null,
                type: ['varchar', 100],
                default: ''
            },
            consumer_hotline: {
                value: null,
                type: ['varchar', 100],
                default: ''
            },
            logo_img: {
                value: null,
                type: ['varchar', 250],
                default: ''
            },
            comment: {
                value: null,
                type: ['varchar', 250],
                default: ''
            }
        }
    });

})
