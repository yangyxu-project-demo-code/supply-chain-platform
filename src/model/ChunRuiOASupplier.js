zn.define(function (pinyin) {

    return zn.Model("zn_chunrui_oa_supplier", {
        mixins: [
            zn.db.common.model.Base
        ],
        properties: {
            _id: {
                value: null,
                type: ['varchar', 100],
                default: ''
            },
            name: {
                value: null,
                type: ['varchar', 100],
                default: ''
            },
            password: {
                value: null,
                type: ['varchar', 100],
                default: '123456'
            },
            email: {
                value: null,
                type: ['varchar', 50],
                default: ''
            },
            phone: {
                value: null,
                type: ['varchar', 20],
                default: ''
            },
            address: {
                value: null,
                type: ['varchar', 250],
                default: ''
            },
            logo_img: {
                value: null,
                type: ['varchar', 250],
                default: ''
            },
            last_login_time: {
                value: null,
                type: ['datetime'],
                format: "date_format({},'%Y-%c-%d %h:%i:%s')",
                default: null
            },
            account: {
                value: null,
                type: ['decimal', [10,2]],
                default: 0
            }
        }
    });

})
