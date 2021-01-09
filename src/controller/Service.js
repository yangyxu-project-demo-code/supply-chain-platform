zn.define(function (){

    var node_officegen = require('officegen'),
        node_xlsx = require('xlsx');

    return zn.Controller('service', {
        methods: {
            selfBack: function (_ticket_id, _instance_id, _base){
                var _defer = zn.async.defer();
                this.beginTransaction()
                    .query(zn.sql.select({
                        table: 'zn_plugin_stock_product_stock',
                        where: {
                            warehouse_id: _base.back_warehouse,
                            product_model: _base.product_model
                        }
                    }))
                    .query('update stock', function (sql, rows){
                        var _sql = '';
                        if(rows.length){
                            var _stock = rows[0];
                            _sql += zn.sql.update({
                                table: 'zn_plugin_stock_product_stock',
                                updates: {
                                    count: _stock.count + _base.count
                                },
                                where: {
                                    warehouse_id: _base.back_warehouse,
                                    product_model: _base.product_model
                                }
                            });
                        }else {
                            _sql += zn.sql.insert({
                                table: 'zn_plugin_stock_product_stock',
                                values: {
                                    count: _base.count,
                                    warehouse_id: _base.back_warehouse,
                                    product_model: _base.product_model
                                }
                            });
                        }

                        _sql += zn.sql.insert({
                            table: 'zn_plugin_stock_product_stock_log',
                            values: {
                                type: '销售单售后退仓',
                                zn_plugin_workflow_instance_id: _instance_id,
                                warehouse_id: _base.back_warehouse,
                                product_model: _base.product_model,
                                number: _base.count
                            }
                        });

                        _sql += zn.sql.update({
                            table: 'zn_workflow_stock_sale_receipt_products',
                            updates: "status=-2",
                            where: { id: _base.sale_receipt_id }
                        });

                        return _sql + zn.sql.update({
                            table: 'zn_workflow_stock_sale_service',
                            updates: { zn_plugin_workflow_ticket_status: -2 },
                            where: { id: _ticket_id }
                        });

                    }, function (err, rows){
                        if(err){
                            _defer.reject(err);
                        }else {
                            _defer.resolve(rows);
                        }
                    })
                    .commit();

                return _defer.promise;
            },
            supplierBack: function (_ticket_id, _instance_id, _base){
                var _defer = zn.async.defer();
                this.beginTransaction()
                    .query('update stock', function (sql, rows){
                        var _sql = zn.sql.insert({
                            table: 'zn_chunrui_oa_supplier_service_back',
                            values: {
                                sale_service_id: _base.id,
                                sale_receipt_id: _base.sale_receipt_id,
                                product_model: _base.product_model,
                                back_warehouse: _base.back_warehouse,
                                customer_id: _base.customer_id,
                                supplier_id: _base.supplier_id,
                                price: _base.price,
                                count: _base.count,
                                amount: _base.total_sum
                            }
                        });

                        _sql += zn.sql.update({
                            table: 'zn_workflow_stock_sale_receipt_products',
                            updates: "status=-2",
                            where: { id: _base.sale_receipt_id }
                        });

                        return _sql + zn.sql.update({
                            table: 'zn_workflow_stock_sale_service',
                            updates: { zn_plugin_workflow_ticket_status: -2 },
                            where: { id: _ticket_id }
                        });

                    }, function (err, rows){
                        if(err){
                            _defer.reject(err);
                        }else {
                            _defer.resolve(rows);
                        }
                    })
                    .commit();

                return _defer.promise;
            },
            doService: {
                method: 'GET',
                argv: {
                    ticket_id: null,
                    instance_id: null
                },
                value: function (request, response, chain){
                    var _ticket_id = request.getValue('ticket_id'),
                        _instance_id = request.getValue('instance_id'),
                        _base = null;
                    this.query("select zn_workflow_stock_sale_service.*, zn_plugin_stock_warehouse.warehouse_type as warehouse_type from zn_workflow_stock_sale_service left join zn_plugin_stock_warehouse on zn_workflow_stock_sale_service.back_warehouse = zn_plugin_stock_warehouse.id where  zn_workflow_stock_sale_service.id = "+_ticket_id)
                        .then(function (data){
                            if(!data[0]){
                                return response.error('为查找到单据'), false;
                            }
                            _base = data[0];
                            if(_base.zn_plugin_workflow_ticket_status == -2){
                                return response.error('该单据已经处理完成'), false;
                            }
                            if(_base.warehouse_type=='self'){
                                return this.selfBack(_ticket_id, _instance_id, _base);
                            }else {
                                return this.supplierBack(_ticket_id, _instance_id, _base);
                            }
                        }.bind(this), function (err){
                            response.error(err);
                        })
                        .then(function (data){
                            response.success(data);
                        }, function (error){
                            response.error(error);
                        });
                }
            }
        }
    });

});
