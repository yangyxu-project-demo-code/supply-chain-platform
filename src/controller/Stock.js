zn.define(function (){

    return zn.Controller('stock', {
        methods: {
            splitItem: {
                method: 'GET/POST',
                argv: {
                    item_id: null,
                    count: null
                },
                value: function (request, response, chain){
                    var _item_id = request.getValue('item_id'),
                        _count = +request.getValue('count');
                    this.beginTransaction()
                        .query(zn.sql.select({
                            table: 'zn_workflow_stock_sale_receipt_products',
                            where: { id: _item_id }
                        }))
                        .query('split item', function (sql, rows){
                            var _value = rows[0],
                                _total_count = _value.count;
                            _value.id = null;
                            delete _value.id;
                            _value.count = _count;
                            _value.total_sum = (_count * _value.price).toFixed(2);
                            return zn.sql.insert({
                                table: 'zn_workflow_stock_sale_receipt_products',
                                values: _value
                            }) + zn.sql.update({
                                table: 'zn_workflow_stock_sale_receipt_products',
                                updates: {
                                    count: _total_count - _count,
                                    total_sum: ((_total_count - _count) * _value.price).toFixed(2)
                                },
                                where: {
                                    id: _item_id
                                }
                            });
                        }, function (err, rows){
                            if(err){
                                response.error(err);
                            }else {
                                response.success(rows);
                            }
                        }).commit();
                }
            },
            clearStock: {
                method: 'GET/POST',
                argv: {
                    warehouse: null
                },
                value: function (request, response, chain){
                    var _warehouse = request.getValue('warehouse');
                    this.beginTransaction()
                        .query('clear stock', function (sql, rows){
                            return zn.sql.delete({
                                table: 'zn_plugin_stock_product_stock',
                                where: "warehouse_id=" + _warehouse
                            });
                        }, function (err, rows){
                            if(err){
                                response.error(err);
                            }else {
                                response.success(rows);
                            }
                        }).commit();
                }
            },
            allocateSingleProductStock: {
                method: 'GET/POST',
                argv: {
                    in_warehouse: null,
                    out_warehouse: null,
                    product_model: null,
                    count: null
                },
                value: function (request, response, chain){
                    var _in_warehouse = request.getValue('in_warehouse'),
                        _out_warehouse = request.getValue('out_warehouse'),
                        _product_model = request.getValue('product_model'),
                        _count = request.getValue('count');
                    var _sqls = [];
                    this.beginTransaction()
                        .query('create batch', function (sql, rows){
                            return "select * from zn_plugin_stock_product_stock where warehouse_id="+_in_warehouse+" and product_model='"+_product_model+"';"
                            + "select * from zn_plugin_stock_product_stock where warehouse_id="+_out_warehouse+" and product_model='"+_product_model+"';";
                        })
                        .query('update stock', function (sql, rows){
                            var _update_stock_sqls = [],
                                _in_stock = rows[0][0],
                                _out_stock = rows[1][0];

                            if(_in_stock){
                                _sqls.push(zn.sql.update({
                                    table: 'zn_plugin_stock_product_stock',
                                    updates: 'count=count+' + _count,
                                    where: {
                                        warehouse_id: _in_warehouse,
                                        product_model: _product_model
                                    }
                                }));
                            }else {
                                _sqls.push(zn.sql.insert({
                                    table: 'zn_plugin_stock_product_stock',
                                    values: {
                                        count: _count,
                                        warehouse_id: _in_warehouse,
                                        product_model: _product_model
                                    }
                                }));
                            }

                            if(_out_stock){
                                _sqls.push(zn.sql.update({
                                    table: 'zn_plugin_stock_product_stock',
                                    updates: 'count=count-' + _count,
                                    where: {
                                        warehouse_id: _out_warehouse,
                                        product_model: _product_model
                                    }
                                }));
                            }else {
                                _sqls.push(zn.sql.insert({
                                    table: 'zn_plugin_stock_product_stock',
                                    values: {
                                        count: -_count,
                                        warehouse_id: _out_warehouse,
                                        product_model: _product_model
                                    }
                                }));
                            }

                            _sqls.push(zn.sql.insert({
                                table: 'zn_plugin_stock_product_stock_log',
                                values: {
                                    type: '从残次仓调拨入库',
                                    warehouse_id: _in_warehouse,
                                    product_model: _product_model,
                                    number: _count
                                }
                            }));

                            _sqls.push(zn.sql.insert({
                                table: 'zn_plugin_stock_product_stock_log',
                                values: {
                                    type: '从残次仓调拨出库',
                                    warehouse_id: _out_warehouse,
                                    product_model: _product_model,
                                    number: -_count
                                }
                            }));

                            return _sqls.join('');
                        }, function (err, rows){
                            if(err){
                                response.error(err);
                            }else {
                                response.success(rows);
                            }
                        }).commit();
                }
            },
            allocateStock: {
                method: 'GET',
                argv: {
                    ticket_id: null,
                    instance_id: null
                },
                value: function (request, response, chain){
                    var _ticket_id = request.getValue('ticket_id'),
                        _instance_id = request.getValue('instance_id');
                    var _base = null,
                        _details = [],
                        _detailObjects = {},
                        _details_sql = [];
                    this.beginTransaction()
                        .query("select ticket and ticket detail", function (){
                            return zn.sql.select({
                                table: 'zn_workflow_stock_allocate',
                                where: { id: _ticket_id }
                            }) + zn.sql.select({
                                table: 'zn_workflow_stock_allocate_details',
                                where: { zn_plugin_workflow_primary_id: _ticket_id }
                            });
                        })
                        .query('create batch', function (sql, rows){
                            if(!rows[0].length){
                                return response.error('为查找到单据'), false;
                            }
                            _base = rows[0][0];
                            if(_base.zn_plugin_workflow_ticket_status == -2){
                                return response.error('该单据已经处理完成'), false;
                            }
                            _details = rows[1];
                            var _product_models = [];
                            _details.forEach(function (detail){
                                detail.count = +detail.count;
                                detail.product_model = detail.product_model.trim();
                                if(_detailObjects[detail.product_model]){
                                    _detailObjects[detail.product_model].count = _detailObjects[detail.product_model].count + detail.count;
                                }else {
                                    _product_models.push("'" + detail.product_model + "'");
                                    _detailObjects[detail.product_model] = detail;
                                }
                            });

                            return "select GROUP_CONCAT(product_model SEPARATOR ',') AS product_models from zn_plugin_stock_product_stock where warehouse_id="+_base.in_warehouse+" and product_model in ("+_product_models.join(',')+");"
                            + "select GROUP_CONCAT(product_model SEPARATOR ',') AS product_models from zn_plugin_stock_product_stock where warehouse_id="+_base.out_warehouse+" and product_model in ("+_product_models.join(',')+");";
                        })
                        .query('update stock', function (sql, rows){
                            var _update_stock_sqls = [],
                                _in_models = ',' + rows[0][0].product_models + ',',
                                _out_models = ',' + rows[1][0].product_models + ',';

                            Object.keys(_detailObjects).map(function (key){
                                var detail = _detailObjects[key];
                                if(_in_models.indexOf(','+detail.product_model+',') != -1) {
                                    _update_stock_sqls.push(zn.sql.update({
                                        table: 'zn_plugin_stock_product_stock',
                                        updates: 'count=count+' + detail.count,
                                        where: {
                                            warehouse_id: _base.in_warehouse,
                                            product_model: detail.product_model
                                        }
                                    }));
                                } else {
                                    _update_stock_sqls.push(zn.sql.insert({
                                        table: 'zn_plugin_stock_product_stock',
                                        values: {
                                            count: detail.count,
                                            warehouse_id: _base.in_warehouse,
                                            product_model: detail.product_model
                                        }
                                    }));
                                }
                                if(_out_models.indexOf(','+detail.product_model+',')!=-1){
                                    _update_stock_sqls.push(zn.sql.update({
                                        table: 'zn_plugin_stock_product_stock',
                                        updates: 'count=count-' + detail.count,
                                        where: {
                                            warehouse_id: _base.out_warehouse,
                                            product_model: detail.product_model
                                        }
                                    }));
                                }else {
                                    _update_stock_sqls.push(zn.sql.insert({
                                        table: 'zn_plugin_stock_product_stock',
                                        values: {
                                            count: -detail.count,
                                            warehouse_id: _base.out_warehouse,
                                            product_model: detail.product_model
                                        }
                                    }));
                                }
                                _update_stock_sqls.push(zn.sql.insert({
                                    table: 'zn_plugin_stock_product_stock_log',
                                    values: {
                                        type: '调拨入库',
                                        zn_plugin_workflow_instance_id: _instance_id,
                                        warehouse_id: _base.in_warehouse,
                                        product_model: detail.product_model,
                                        number: detail.count
                                    }
                                }));

                                _update_stock_sqls.push(zn.sql.insert({
                                    table: 'zn_plugin_stock_product_stock_log',
                                    values: {
                                        type: '调拨出库',
                                        zn_plugin_workflow_instance_id: _instance_id,
                                        warehouse_id: _base.out_warehouse,
                                        product_model: detail.product_model,
                                        number: -detail.count
                                    }
                                }));

                            });

                            _update_stock_sqls.push(zn.sql.update({
                                table: 'zn_workflow_stock_allocate',
                                updates: { zn_plugin_workflow_ticket_status: -2 },
                                where: { id: _ticket_id }
                            }));

                            return _update_stock_sqls.join('');
                        }, function (err, rows){
                            if(err){
                                response.error(err);
                            }else {
                                response.success(rows);
                            }
                        }).commit();
                }
            },
            inStock: {
                method: 'GET',
                argv: {
                    ticket_id: null,
                    instance_id: null
                },
                value: function (request, response, chain){
                    var _ticket_id = request.getValue('ticket_id'),
                        _instance_id = request.getValue('instance_id');
                    var _base = null,
                        _details = [],
                        _detailObjects = {},
                        _details_sql = [];
                    var _batch_code = 'BN-' + zn.date.nowDateString()+ "-" + zn.util.randomNumbers(5);
                    this.beginTransaction()
                        .query("select ticket and ticket detail", function (){
                            return zn.sql.select({
                                table: 'zn_workflow_stock_in',
                                where: { id: _ticket_id }
                            }) + zn.sql.select({
                                table: 'zn_workflow_stock_in_details',
                                where: { zn_plugin_workflow_primary_id: _ticket_id }
                            });
                        })
                        .query('create batch', function (sql, rows){
                            if(!rows[0].length){
                                return response.error('为查找到单据'), false;
                            }
                            _base = rows[0][0];
                            if(_base.zn_plugin_workflow_ticket_status == -2){
                                return response.error('该单据已经处理完成'), false;
                            }
                            _details = rows[1];
                            var _total_number = 0,
                                _total_amount = 0,
                                _product_models = [];
                            _details.forEach(function (detail){
                                _total_number += detail.count;
                                _total_amount += detail.price * detail.count;
                                if(_detailObjects[detail.product_model]){
                                    _detailObjects[detail.product_model].count = _detailObjects[detail.product_model].count + detail.count;
                                }else {
                                    _product_models.push("'" + detail.product_model + "'");
                                    _detailObjects[detail.product_model] = detail;
                                }
                            });
                            return zn.sql.insert({
                                table: 'zn_plugin_stock_product_batch',
                                values: {
                                    batch_code: _batch_code,
                                    warehouse_id: _base.in_warehouse,
                                    total_number: _total_number,
                                    total_amount: _total_amount
                                }
                            }) + "select * from zn_plugin_stock_product where model in ("+_product_models.join(',')+");" + "select GROUP_CONCAT(product_model SEPARATOR ',') AS product_models from zn_plugin_stock_product_stock where warehouse_id="+_base.in_warehouse+" and product_model in ("+_product_models.join(',')+");";
                        })
                        .query('update stock', function (sql, rows){
                            var _products = rows[1],
                                _product_obj = {},
                                _update_stock_sqls = [],
                                _product_models = ',' + rows[2][0].product_models + ',';

                            _products.forEach(function (product){
                                _product_obj[product.model] = product;
                            });
                            Object.keys(_detailObjects).map(function (key){
                                var detail = _detailObjects[key];
                                var _product = _product_obj[detail.product_model],
                                    _updates = {};
                                if(!_product){
                                    return;
                                }
                                _details_sql.push(zn.sql.insert({
                                    table: 'zn_plugin_stock_product_batch_detail',
                                    values: {
                                        batch_code: _batch_code,
                                        batch_id: "{0}",
                                        warehouse_id: _base.in_warehouse,
                                        product_model: detail.product_model,
                                        price: detail.price,
                                        number: detail.count,
                                        unused_number: detail.count,
                                        amount: detail.price * detail.count
                                    }
                                }));
                                if(_product_models.indexOf(','+detail.product_model+',')!=-1){
                                    _update_stock_sqls.push(zn.sql.update({
                                        table: 'zn_plugin_stock_product_stock',
                                        updates: 'count=count+' + detail.count,
                                        where: {
                                            warehouse_id: _base.in_warehouse,
                                            product_model: detail.product_model
                                        }
                                    }));
                                }else {
                                    _update_stock_sqls.push(zn.sql.insert({
                                        table: 'zn_plugin_stock_product_stock',
                                        values: {
                                            count: detail.count,
                                            warehouse_id: _base.in_warehouse,
                                            product_model: detail.product_model
                                        }
                                    }));
                                }
                                _update_stock_sqls.push(zn.sql.insert({
                                    table: 'zn_plugin_stock_product_stock_log',
                                    values: {
                                        type: '采购入库',
                                        zn_plugin_workflow_instance_id: _instance_id,
                                        warehouse_id: _base.in_warehouse,
                                        product_model: detail.product_model,
                                        number: detail.count
                                    }
                                }));
                                _updates.average_price = _product.average_price?(_product.average_price + detail.price) / 2 : detail.price;
                                _update_stock_sqls.push(zn.sql.update({
                                    table: 'zn_plugin_stock_product',
                                    updates: _updates,
                                    where: { model: detail.product_model }
                                }));
                            });

                            _update_stock_sqls.push(zn.sql.update({
                                table: 'zn_workflow_stock_in',
                                updates: { batch_code: _batch_code, zn_plugin_workflow_ticket_status: -2 },
                                where: { id: _ticket_id }
                            }));

                            return _details_sql.join('').format(rows[0].insertId) + _update_stock_sqls.join('');
                        }, function (err, rows){
                            if(err){
                                response.error(err);
                            }else {
                                response.success(rows);
                            }
                        }).commit();
                }
            },
            outStock: {
                method: 'GET',
                argv: {
                    ticket_id: null,
                    instance_id: null
                },
                value: function (request, response, chain){
                    var _ticket_id = request.getValue('ticket_id'),
                        _instance_id = request.getValue('instance_id');
                    var _base = null,
                        _details = [],
                        _details_object = {},
                        _details_sql = [],
                        _update_stock_sql = [],
                        _validate = [];
                    this.beginTransaction()
                        .query("select ticket and ticket detail", function (){
                            return zn.sql.select({
                                table: 'zn_workflow_stock_out',
                                where: { id: _ticket_id }
                            }) + zn.sql.select({
                                table: 'zn_workflow_stock_out_details',
                                where: { zn_plugin_workflow_primary_id: _ticket_id }
                            });
                        })
                        .query('validate stock', function (sql, rows){
                            if(!rows[0].length){
                                return response.error('为查找到单据'), false;
                            }
                            _base = rows[0][0];
                            if(_base.zn_plugin_workflow_ticket_status == -2){
                                return response.error('该单据已经处理完成'), false;
                            }
                            _details = rows[1];
                            var _batch_detail_sqls = [];
                            _details.forEach(function (detail){
                                if(_details_object[detail.product_model]){
                                    _details_object[detail.product_model].count = _details_object[detail.product_model].count + detail.count;
                                }else {
                                    _details_object[detail.product_model] = detail;
                                }
                            });
                            Object.keys(_details_object).map(function (key){
                                var detail = _details_object[key];
                                _validate.push(detail.count);
                                _batch_detail_sqls.push(zn.sql.select({
                                    table: 'zn_plugin_stock_product_batch_detail',
                                    fields: 'sum(unused_number) as unused',
                                    where: "warehouse_id={0} and product_model='{1}'".format(_base.out_warehouse, detail.product_model)
                                }));
                                _details_sql.push(zn.sql.select({
                                    table: 'zn_plugin_stock_product_batch_detail',
                                    where: "unused_number>0 and warehouse_id="+_base.out_warehouse+" and product_model='"+detail.product_model + "'"
                                }));
                            });

                            return _batch_detail_sqls.join('') + zn.sql.select({
                                table: 'zn_plugin_stock_product_stock',
                                fields: "group_concat(',',product_model, ',') as models",
                                where: {
                                    warehouse_id: _base.out_warehouse
                                }
                            });
                        })
                        .query('out stock', function (sql, rows){
                            /* 做系统库存严重, 如果是不允许负库存的， 该代码必须启用
                            for(var i = 0, _len = rows.length-1; i < _len; i++){
                                if(rows[i].unused < _validate[i]){
                                    return response.error('库存量不够, 请确认系统中有足够的库存。'), false;
                                }
                            }*/

                            var _models = rows[rows.length-1][0].models;
                            Object.keys(_details_object).map(function (key){
                                var detail = _details_object[key];
                                if(_models.indexOf(','+detail.product_model+',')==-1){
                                    _update_stock_sql.push(zn.sql.insert({
                                        table: 'zn_plugin_stock_product_stock',
                                        values: {
                                            count: -detail.count,
                                            warehouse_id: _base.out_warehouse,
                                            product_model: detail.product_model
                                        }
                                    }));
                                }else {
                                    _update_stock_sql.push(zn.sql.update({
                                        table: 'zn_plugin_stock_product_stock',
                                        updates: 'count=count-'+ detail.count,
                                        where: {
                                            warehouse_id: _base.out_warehouse,
                                            product_model: detail.product_model
                                        }
                                    }));
                                }
                                _update_stock_sql.push(zn.sql.insert({
                                    table: 'zn_plugin_stock_product_stock_log',
                                    values: {
                                        type: '开单出库',
                                        zn_plugin_workflow_instance_id: _instance_id,
                                        warehouse_id: _base.out_warehouse,
                                        product_model: detail.product_model,
                                        number: detail.count
                                    }
                                }));
                            });

                            return _details_sql.join('');
                        })
                        .query('update stock', function (sql, rows){
                            var _sql = [];
                            if(rows[0].length == undefined){
                                rows = [rows];
                            }
                            rows.forEach(function (data, index){
                                var _count = _validate[index],
                                    _item = null;
                                for(var i = 0, _len = data.length; i < _len; i++){
                                    _item = data[i];
                                    if(_count<1){
                                        break;
                                    }
                                    if(_count>_item.unused_number){
                                        _sql.push(zn.sql.update({
                                            table: 'zn_plugin_stock_product_batch_detail',
                                            updates: {
                                                unused_number: 0,
                                                used_number: _item.number
                                            },
                                            where: {
                                                id: _item.id
                                            }
                                        }));
                                        _sql.push(zn.sql.insert({
                                            table: 'zn_workflow_stock_out_batch',
                                            values: {
                                                batch_code: _item.batch_code,
                                                product_model: _item.product_model,
                                                count: _item.number
                                            }
                                        }));
                                    }else {
                                        _sql.push(zn.sql.update({
                                            table: 'zn_plugin_stock_product_batch_detail',
                                            updates: {
                                                unused_number: _item.unused_number - _count,
                                                used_number: _item.number - (_item.unused_number - _count)
                                            },
                                            where: {
                                                id: _item.id
                                            }
                                        }));
                                        _sql.push(zn.sql.insert({
                                            table: 'zn_workflow_stock_out_batch',
                                            values: {
                                                batch_code: _item.batch_code,
                                                product_model: _item.product_model,
                                                count: _count
                                            }
                                        }));
                                    }
                                    _count = _count - _item.unused_number;
                                }
                            });

                            return _sql.join('') + _update_stock_sql.join('') + zn.sql.update({
                                table: 'zn_workflow_stock_out',
                                updates: { zn_plugin_workflow_ticket_status: -2 },
                                where: { id: _ticket_id }
                            });
                        }, function (err, rows){
                            if(err){
                                response.error(err);
                            }else {
                                response.success(rows);
                            }
                        })
                        .commit();
                }
            },
            receiptsOutStock: {
                method: 'GET',
                argv: {
                    ticket_id: null,
                    instance_id: null
                },
                value: function (request, response, chain){
                    var _ticket_id = request.getValue('ticket_id'),
                        _instance_id = request.getValue('instance_id');
                    var _base = null, _products = {}, _total_price = 0;
                    this.beginTransaction()
                        .query("select ticket", function (){
                            return zn.sql.select({
                                table: 'zn_workflow_stock_sale_receipt',
                                where: { id: _ticket_id }
                            }) + zn.sql.select({
                                table: 'zn_workflow_stock_sale_receipt_products',
                                where: { zn_plugin_workflow_primary_id: _ticket_id }
                            }) + zn.sql.select({
                                table: 'zn_plugin_stock_warehouse',
                                fields: "group_concat(',',id,',') as ids"
                            });
                        })
                        .query('validate stock', function (sql, rows){
                            if(!rows[0]){
                                return response.error('为查找到单据'), false;
                            }
                            _base = rows[0][0];
                            _base.ids = rows[2][0].ids;
                            if(_base.zn_plugin_workflow_ticket_status == -2){
                                return response.error('该单据已经处理完成'), false;
                            }
                            var _temps = [], _sqls = [], _key = '';
                            rows[1].map(function (item){
                                _key = item.product_model + '&&&&&&' + item.out_warehouse;
                                item.count = +item.count;
                                item.total_sum = +item.total_sum;
                                if(_products[_key]){
                                    _products[_key].count += item.count;
                                    _products[_key].total_sum += item.total_sum;
                                }else {
                                    _products[_key] = {
                                        count: item.count,
                                        product_model: item.product_model,
                                        out_warehouse: item.out_warehouse,
                                        total_sum: item.total_sum,
                                        customer_id: item.customer_id
                                    };
                                    _sqls.push(zn.sql.select({
                                        table: 'zn_plugin_stock_product_stock',
                                        fields: 'count, product_model, warehouse_id',
                                        where: {
                                            product_model: item.product_model,
                                            warehouse_id: item.out_warehouse
                                        }
                                    }));
                                    _temps.push(_products[_key]);
                                }
                            });
                            _products = _temps;
                            _sqls.push(zn.sql.update({
                                table: 'zn_workflow_stock_sale_receipt',
                                updates: {
                                    zn_plugin_workflow_ticket_status: -2
                                },
                                where: { id: _ticket_id }
                            }));

                            return _sqls.join('');
                        })
                        .query("update stock", function (sql, data){
                            var _sqls = [];
                            for(var i = 0, _len = _products.length; i<_len; i++){
                                var _value = _products[i];
                                    _total_price  += _value.total_sum;
                                    _customer_id = _value.customer_id;
                                if(data[i][0]){
                                    _sqls.push(zn.sql.update({
                                        table: 'zn_plugin_stock_product_stock',
                                        updates: "count=count-" + _value.count,
                                        where: {
                                            product_model: _value.product_model,
                                            warehouse_id: _value.out_warehouse
                                        }
                                    }));
                                    _sqls.push(zn.sql.insert({
                                        table: 'zn_plugin_stock_product_stock_log',
                                        values: {
                                            type: '销售单出库',
                                            zn_plugin_workflow_instance_id: _instance_id,
                                            warehouse_id: _value.out_warehouse,
                                            product_model: _value.product_model,
                                            number: -(_value.count)
                                        }
                                    }));
                                }else {
                                    if(_base.ids.indexOf(','+_value.out_warehouse+',')!=-1){
                                        _sqls.push(zn.sql.insert({
                                            table: 'zn_plugin_stock_product_stock',
                                            values: {
                                                count: -(_value.count),
                                                product_model: _value.product_model,
                                                warehouse_id: _value.out_warehouse
                                            }
                                        }));
                                        _sqls.push(zn.sql.insert({
                                            table: 'zn_plugin_stock_product_stock_log',
                                            values: {
                                                type: '销售单出库',
                                                zn_plugin_workflow_instance_id: _instance_id,
                                                warehouse_id: _value.out_warehouse,
                                                product_model: _value.product_model,
                                                number: -(_value.count)
                                            }
                                        }));
                                    }
                                }
                            }
                            
                            _sqls.push(zn.sql.update({
                                table: 'zn_workflow_stock_sale_receipt_products',
                                updates: { status: 1 },
                                where: { zn_plugin_workflow_primary_id: _ticket_id }
                            }));

                            _sqls.push(zn.sql.insert({
                                table: 'zn_chunrui_oa_customer_bill',
                                values: {
                                    customer_id: _customer_id,
                                    ticket_id: _ticket_id,
                                    instance_id: _instance_id,
                                    total_price: -(_total_price),
                                    state: 0
                                }
                            }));

                            return _sqls.join('');
                        })
                        .query("select account:", function(){
                            return zn.sql.select({
                                table: 'zn_chunrui_oa_customer',
                                fields: 'account',
                                where: { id: _customer_id}
                            });
                        })
                        .query("update account:", function(sql, rows){
                            var _items = rows[0];
                                _account = _items.account - _total_price;
                            return zn.sql.update({
                                table: 'zn_chunrui_oa_customer',
                                updates: { account: _account },
                                where: { id: _customer_id }
                            });
                        }, function (err, rows){
                            if(err){
                                response.error(err);
                            }else {
                                response.success(rows);
                            }
                        })
                        .commit();
                }
            },
            backStock: {
                method: 'GET',
                argv: {
                    ticket_id: null,
                    instance_id: null
                },
                value: function (request, response, chain){
                    var _ticket_id = request.getValue('ticket_id'),
                        _instance_id = request.getValue('instance_id');
                    var _base = null;
                    this.beginTransaction()
                        .query("select ticket", function (){
                            return "select * from zn_workflow_stock_sale_service where id="+_ticket_id;
                        })
                        .query('validate stock', function (sql, rows){
                            if(!rows[0]){
                                return response.error('为查找到单据'), false;
                            }
                            _base = rows[0];
                            if(_base.zn_plugin_workflow_ticket_status == -2){
                                return response.error('该单据已经处理完成'), false;
                            }

                            return zn.sql.select({
                                table: 'zn_plugin_stock_product_stock',
                                where: {
                                    warehouse_id: _base.back_warehouse,
                                    product_model: _base.product_model
                                }
                            });
                        })
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

                            _sql += zn.sql.insert({
                                table: 'zn_chunrui_oa_customer_bill',
                                values: {
                                    customer_id: _base.customer_id,
                                    ticket_id: _base.id,
                                    instance_id: _base.zn_plugin_workflow_instance_id,
                                    total_price: _base.total_sum,
                                    state: 2,
                                    zn_note: '销售单售后退仓'
                                }
                            });

                            return _sql + zn.sql.update({
                                table: 'zn_workflow_stock_sale_service',
                                updates: { zn_plugin_workflow_ticket_status: -2 },
                                where: { id: _ticket_id }
                            });

                        })
                        .query('select account:',function(){
                            return zn.sql.select({
                                table: 'zn_chunrui_oa_customer',
                                where: {
                                    id: _base.customer_id
                                }
                            });
                        })
                        .query('update account:', function(sql, data){
                            var _items = data[0];
                                _account = _items.account + _base.total_sum;
                            return zn.sql.update({
                                table: 'zn_chunrui_oa_customer',
                                updates: {
                                    account: _account
                                },
                                where: {
                                    id: _base.customer_id
                                }
                            });
                        }, function (err, rows){
                            if(err){
                                response.error(err);
                            }else {
                                response.success(rows);
                            }
                        })
                        .commit();
                }
            },
            backReceiptItem: {
                method: 'GET/POST',
                argv: {
                    item_id: null
                },
                value: function (request, response, chain){
                    var _item_id = request.getValue('item_id'),
                        _count = request.getInt('count');
                    var _base = null;
                    this.beginTransaction()
                        .query("select ticket", function (){
                            return zn.sql.select({
                                table: 'zn_workflow_stock_sale_receipt_products',
                                where: { id: _item_id }
                            });
                        })
                        .query('validate stock', function (sql, rows){
                            if(!rows[0]){
                                return response.error('为查找到单据'), false;
                            }
                            _base = rows[0];
                            var _sql = zn.sql.update({
                                table: 'zn_plugin_stock_product_stock',
                                updates: "count=count+" + (_count || _base.count),
                                where: {
                                    product_model: _base.product_model,
                                    warehouse_id: _base.out_warehouse
                                }
                            });
                            if(!_count || (_count && _count == _base.count)) {
                                _sql += zn.sql.delete({
                                    table: 'zn_workflow_stock_sale_receipt_products',
                                    where: { id: _item_id }
                                });
                                _sql += zn.sql.insert({
                                    table: 'zn_plugin_stock_product_stock_log',
                                    values: {
                                        type: '销售单作废退仓',
                                        warehouse_id: _base.out_warehouse,
                                        product_model: _base.product_model,
                                        number: (_count || _base.count)
                                    }
                                });
                                _sql += zn.sql.insert({
                                    table: 'zn_chunrui_oa_customer_bill',
                                    values: {
                                        customer_id: _base.customer_id,
                                        ticket_id: _base.zn_plugin_workflow_primary_id,
                                        instance_id: _base.zn_plugin_workflow_instance_id,
                                        total_price: (_count || _base.count)*_base.price,
                                        state: 2,
                                        zn_note: '销售单作废退仓'
                                    }
                                });
                            }else {
                                _sql += zn.sql.update({
                                    table: 'zn_workflow_stock_sale_receipt_products',
                                    updates: "count=count-" + _count + ", total_sum=total_sum - price*" + (+_count),
                                    where: { id: _item_id }
                                });
                                _sql += zn.sql.insert({
                                    table: 'zn_plugin_stock_product_stock_log',
                                    values: {
                                        type: '销售单直接退仓',
                                        warehouse_id: _base.out_warehouse,
                                        product_model: _base.product_model,
                                        number: (_count || _base.count)
                                    }
                                });
                                _sql += zn.sql.insert({
                                    table: 'zn_chunrui_oa_customer_bill',
                                    values: {
                                        customer_id: _base.customer_id,
                                        ticket_id: _base.zn_plugin_workflow_primary_id,
                                        instance_id: _base.zn_plugin_workflow_instance_id,
                                        total_price: (_count || _base.count)*_base.price,
                                        state: 2,
                                        zn_note: '销售单直接退仓'
                                    }
                                });
                            }

                            return _sql;
                        })
                        .query('select account:',function(){
                            return zn.sql.select({
                                table: 'zn_chunrui_oa_customer',
                                where: {
                                    id: _base.customer_id
                                }
                            });
                        })
                        .query('update account:', function(sql, data){
                            var _items = data[0];
                                _account = _items.account + (_count || _base.count)*_base.price;
                            return zn.sql.update({
                                table: 'zn_chunrui_oa_customer',
                                updates: {
                                    account: _account
                                },
                                where: {
                                    id: _base.customer_id
                                }
                            });
                        }, function (err, rows){
                            if(err){
                                response.error(err);
                            }else {
                                response.success(rows);
                            }
                        })
                        .commit();
                }
            },
            backReceiptItemWithoutStock: {
                method: 'GET/POST',
                argv: {
                    item_id: null
                },
                value: function (request, response, chain){
                    var _item_id = request.getValue('item_id'),
                        _count = request.getInt('count');
                    var _base = null;
                    this.beginTransaction()
                        .query("select ticket", function (){
                            return zn.sql.select({
                                table: 'zn_workflow_stock_sale_receipt_products',
                                where: { id: _item_id }
                            });
                        })
                        .query('validate stock', function (sql, rows){
                            if(!rows[0]){
                                return response.error('为查找到单据'), false;
                            }
                            _base = rows[0];
                            var _sql = '';
                            if(!_count || (_count && _count == _base.count)) {
                                _sql += zn.sql.delete({
                                    table: 'zn_workflow_stock_sale_receipt_products',
                                    where: { id: _item_id }
                                });
                            }else {
                                _sql += zn.sql.update({
                                    table: 'zn_workflow_stock_sale_receipt_products',
                                    updates: "count=" + _count + ", total_sum=price*" + (+_count),
                                    where: { id: _item_id }
                                });
                            }

                            return _sql;
                        }, function (err, rows){
                            if(err){
                                response.error(err);
                            }else {
                                response.success(rows);
                            }
                        })
                        .commit();
                }
            }
        }
    });

});
