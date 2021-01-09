zn.define(['node:https','node:axios'], function (https, axios){
    return zn.Controller('express', {
        methods: {
            updateExpressInfo: {
                method: 'GET/POST',
                argv: {
                    sale_receipt_order_id: null
                },
                value: function (request, response, chain){
                    var _order_id = request.getValue('sale_receipt_order_id'),
                        _express_data = null;
                    this.beginTransaction()
                        .query("select order", function (sql, data){
                            return zn.sql.select({
                                table: 'zn_workflow_stock_sale_receipt_products left join zn_chunrui_oa_express_company on locate(zn_workflow_stock_sale_receipt_products.express_company, zn_chunrui_oa_express_company.title)>0',
                                fields: [
                                    'zn_workflow_stock_sale_receipt_products.express_code as express_code',
                                    'zn_chunrui_oa_express_company.code_kuaidiwo as express_company'
                                ],
                                where: "zn_workflow_stock_sale_receipt_products.id=" + _order_id
                            });
                        })
                        .query("", function (sql, data){
                            var _item = data[0];
                            if(_item){
                                if(!_item.express_company){
                                    return response.error("系统未查到该快递公司信息, 请确认后再查询."), false;
                                }
                                if(!_item.express_code){
                                    return response.error("该订单中快递单号为空"), false;
                                }
                                var _param = {
                                        key: 'WCSAhVics5bx',
                                        com: _item.express_company,
                                        cno: _item.express_code
                                    },
                                    _defer = zn.async.defer();
                                axios({
                                    method: 'get',
                                    url: 'http://api.kuaidiwo.cn:88/api/?'+zn.querystring.stringify(_param)
                                }).then(function (response){
                                    try {
                                        var _data = response.data;
                                        if(+_data.errcode==0){
                                            _defer.resolve(_data);
                                        }else {
                                            _defer.reject(new Error("请求失败：" + _data.message));
                                            response.error("请求失败：" + _data.message);
                                        }
                                    } catch (e) {
                                        _defer.reject(e);
                                        response.error("请求失败：" + e.message);
                                    }
                                });
                                return _defer.promise;
                            }else {
                                return response.error("未查到订单"), false;
                            }
                        })
                        .query("select done count", function (sql, data){
                            var _updates = {};
                            _express_data = data;
                            if(+data.errcode==0){
                                _updates.express_state = data.ems_info.state;
                                _updates.express_data = JSON.stringify(data);
                            }else {
                                _updates.express_state = -1;
                                _updates.express_data = JSON.stringify(data);
                            }
                            return zn.sql.update({
                                table: 'zn_workflow_stock_sale_receipt_products',
                                updates: _updates,
                                where: { id: _order_id }
                            })
                        }, function (error, data){
                            if(error){
                                response.error(error);
                            }else {
                                response.success(_express_data);
                            }
                        })
                        .commit();
                }
            }
        }
    });

});
