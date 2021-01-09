zn.define(function (){

    var node_xlsx = require('xlsx');

    return zn.Controller('quote', {
        methods: {
            init_customer_quote: {
                method: 'GET/POST',
                argv: {
                    customer: null,
                    price_field: null
                },
                value: function (request, response, chain){
                    var _customer = request.getValue("customer"),
                        _price_field = request.getValue('price_field');
                    this.beginTransaction()
                        .query(zn.sql.delete({
                            table: 'zn_chunrui_oa_customer_product_quote',
                            where: [
                                "customer_id=" + _customer
                            ]
                        }) + zn.sql.select({
                            table: 'zn_plugin_stock_product',
                            fields: "id, model, express_price, " + _price_field + " as price"
                        }))
                        .query('query no in products: ', function (sql, data){
                            var _prices = data[1];
                            _prices = _prices.map(function (item){
                                return zn.sql.insert({
                                    table: 'zn_chunrui_oa_customer_product_quote',
                                    values: {
                                        product_model: item.model,
                                        customer_id: _customer||0,
                                        price: item.price||0,
                                        express_price: item.express_price||0
                                    }
                                });
                            });
                            return _prices.join('');
                        }, function (err, data){
                            if(err){
                                response.error(err);
                            }else {
                                response.success(data);
                            }
                        })
                        .commit();
                }
            },
            init_supplier_quote: {
                method: 'GET/POST',
                argv: {
                    supplier: null,
                    price_field: null
                },
                value: function (request, response, chain){
                    var _supplier = request.getValue("supplier"),
                        _price_field = request.getValue('price_field');
                    this.beginTransaction()
                        .query(zn.sql.delete({
                            table: 'zn_chunrui_oa_supplier_product_quote',
                            where: [
                                "supplier_id=" + _supplier
                            ]
                        }) + zn.sql.select({
                            table: 'zn_plugin_stock_product',
                            fields: "id, model, express_price, " + _price_field + " as price"
                        }))
                        .query('query no in products: ', function (sql, data){
                            var _prices = data[1];
                            _prices = _prices.map(function (item){
                                return zn.sql.insert({
                                    table: 'zn_chunrui_oa_supplier_product_quote',
                                    values: {
                                        product_model: item.model,
                                        supplier_id: _supplier||0,
                                        price: item.price||0,
                                        express_price: item.express_price||0
                                    }
                                });
                            });
                            return _prices.join('');
                        }, function (err, data){
                            if(err){
                                response.error(err);
                            }else {
                                response.success(data);
                            }
                        })
                        .commit();
                }
            },
            customer_products: {
                method: 'GET/POST',
                argv: {
                    customer: null
                },
                value: function (request, response, chain){
                    var _customer = request.getValue("customer");
                    var _data = {};
                    this.beginTransaction()
                        .query(zn.sql.select({
                            table: 'zn_chunrui_oa_customer_product_quote left join zn_plugin_stock_product on zn_chunrui_oa_customer_product_quote.product_model = zn_plugin_stock_product.model',
                            fields: [
                                ' distinct zn_plugin_stock_product.zn_title as zn_title',
                                'zn_plugin_stock_product.id as id',
                            	'zn_plugin_stock_product.model as model',
                            	'zn_plugin_stock_product.package_size as package_size',
                            	'zn_plugin_stock_product.net_weight as net_weight',
                            	'zn_plugin_stock_product.min_price as min_price',
                            	'zn_plugin_stock_product.max_price as max_price',
                            	'zn_plugin_stock_product.average_price as average_price',
                            	'zn_plugin_stock_product.sale_price as sale_price',
                            	'zn_plugin_stock_product.purchase_price as purchase_price',
                            	'zn_plugin_stock_product.express_price as express_price',
                                'zn_chunrui_oa_customer_product_quote.id as quote_id',
                                'zn_chunrui_oa_customer_product_quote.price as quote_price',
                                'zn_chunrui_oa_customer_product_quote.express_price as quote_express_price',
                                'zn_chunrui_oa_customer_product_quote.customer_id as customer_id'
                            ],
                            where: [
                                "zn_chunrui_oa_customer_product_quote.customer_id=" + _customer
                            ]
                        }))
                        .query('query no in products: ', function (sql, data){
                            var _ids = [];
                            data.filter(function (item){ if(item && item.id){ _ids.push(item.id); } });
                            _data.selected = data;
                            return zn.sql.select({
                                table: 'zn_plugin_stock_product',
                                fields: [
                                    '*'
                                ],
                                where: "id not in ("+(_ids.join(',')||'0')+")"
                            });
                        }, function (err, data){
                            if(err){
                                response.error(err);
                            }else {
                                _data.all = data;
                                response.success(_data);
                            }
                        })
                        .commit();
                }
            },
            supplier_products: {
                method: 'GET/POST',
                argv: {
                    supplier: null
                },
                value: function (request, response, chain){
                    var _supplier = request.getValue("supplier");
                    var _data = {};
                    this.beginTransaction()
                        .query(zn.sql.select({
                            table: 'zn_chunrui_oa_supplier_product_quote left join zn_plugin_stock_product on zn_chunrui_oa_supplier_product_quote.product_model = zn_plugin_stock_product.model',
                            fields: [
                                ' distinct zn_plugin_stock_product.zn_title as zn_title',
                                'zn_plugin_stock_product.id as id',
                            	'zn_plugin_stock_product.model as model',
                            	'zn_plugin_stock_product.package_size as package_size',
                            	'zn_plugin_stock_product.net_weight as net_weight',
                            	'zn_plugin_stock_product.min_price as min_price',
                            	'zn_plugin_stock_product.max_price as max_price',
                            	'zn_plugin_stock_product.average_price as average_price',
                            	'zn_plugin_stock_product.sale_price as sale_price',
                            	'zn_plugin_stock_product.purchase_price as purchase_price',
                            	'zn_plugin_stock_product.express_price as express_price',
                                'zn_chunrui_oa_supplier_product_quote.id as quote_id',
                                'zn_chunrui_oa_supplier_product_quote.price as quote_price',
                                'zn_chunrui_oa_supplier_product_quote.express_price as quote_express_price',
                                'zn_chunrui_oa_supplier_product_quote.supplier_id as supplier_id'
                            ],
                            where: [
                                "zn_chunrui_oa_supplier_product_quote.supplier_id=" + _supplier
                            ]
                        }))
                        .query('query no in products: ', function (sql, data){
                            var _ids = [];
                            data.filter(function (item){ if(item && item.id){ _ids.push(item.id); } });
                            _data.selected = data;
                            return zn.sql.select({
                                table: 'zn_plugin_stock_product',
                                fields: [
                                    '*'
                                ],
                                where: "id not in ("+(_ids.join(',')||'0')+")"
                            });
                        }, function (err, data){
                            if(err){
                                response.error(err);
                            }else {
                                _data.all = data;
                                response.success(_data);
                            }
                        })
                        .commit();
                }
            },
            init_quotes: {
                method: 'GET/POST',
                argv: {
                    type: 'customer',
                    value: null
                },
                value: function (request, response, chain){
                    var _type = request.getValue("type");
                    this.beginTransaction()
                        .query('query no in products: ', function (sql, data){
                            return zn.sql.delete({
                                table: 'zn_chunrui_oa_' + _type + '_product_quote',
                                where: _type + "_id=" + request.getValue("value")
                            });
                        }, function (err, data){
                            if(err){
                                response.error(err);
                            }else {
                                response.success(data);
                            }
                        })
                        .commit();
                }
            },
            importProductQuote: {
                method: 'GET/POST',
                argv: {
                    start: 1,
                    type: 'customer'
                },
                value: function (request, response, chain){
                    var _result = [],
                        _files = request.$files,
                        _type = request.getValue('type'),
                        _start = request.getInt('start'),
                        _models = ',',
                        _vars = JSON.parse(request.getValue('vars')||'{}');

                    this.beginTransaction()
                        .query(zn.sql.select({
                            table: 'zn_chunrui_oa_' + _type,
                            fields: 'id, zn_title',
                            where: {
                                zn_deleted: 0
                            }
                        })+"select product_model, "+_type+"_id from zn_chunrui_oa_" + _type + "_product_quote;"+"select model from zn_plugin_stock_product;")
                        .query('insert data', function (sql, data){
                            var rows = data[0];
                            if(!rows.length){
                                return response.error('系统暂无客户或供应商'), false;
                            }
                            var _models = data[1].map(function (item){ return item.product_model + "&&&" + item[_type+"_id"]; });
                            var _allmodels = data[2].map(function (item){ return item.model; });
                            var _titleIds = {},
                                _sqls = [],
                                _notExists = [];
                            for(var i = 0, _len = rows.length; i < _len; i++){
                                _titleIds[rows[i].zn_title] = rows[i].id;
                            }
                            for(var name in _files){
                                var _file = request.uploadFile(_files[name]),
                                    _worksheet = node_xlsx.readFile(_file.path),
                                    _type_id = 0,
                                    _data = [];
                                for(var name in _worksheet.Sheets){
                                    _data = node_xlsx.utils.sheet_to_json(_worksheet.Sheets[name], {
                                        header: 1,
                                        raw: true
                                    });
                                    _type_id = _titleIds[name];
                                    if(!_type_id){
                                        return response.error('【' + name + '】不存在'), false;
                                    }

                                    zn.each(_data, function (item, index){
                                        if(index > (_start-1)){
                                            if(item.length){
                                                var _values = { },
                                                    _value = null,
                                                    _name = null;
                                                _values[_type+"_id"] = _type_id;
                                                var _where = _values;
                                                for(var i = 0; i < item.length; i++){
                                                    _value = item[i]||'';
                                                    _name = _vars[i]||'';
                                                    if(!_name || !_value){
                                                        continue;
                                                    }
                                                    _values[_name] = _value;
                                                }
                                                _values.product_model = _values.product_model.trim();
                                                if(_allmodels.indexOf(_values.product_model) != -1){
                                                    if(_models.indexOf(_values.product_model + "&&&" + _type_id) == -1){
                                                        _sqls.push(zn.sql.insert({
                                                            table: "zn_chunrui_oa_" + _type + "_product_quote",
                                                            values: _values
                                                        }));
                                                    }else {
                                                        var _price = _values.price;
                                                        _where.product_model = _values.product_model;
                                                        _where.price = null; 
                                                        delete _where.price;
                                                        _sqls.push(zn.sql.update({
                                                            table: "zn_chunrui_oa_" + _type + "_product_quote",
                                                            updates: { price: _price },
                                                            where: _where
                                                        }));
                                                    }
                                                }else {
                                                    _notExists.push(_values.product_model);
                                                }
                                            }
                                        }
                                    });
                                }
                            }
                            if(_notExists.length){
                                return response.error("以下商品型号【"+_notExists.join(', ')+"】共【"+_notExists.length+"】个商品,系统未查到请核实。"), false;
                            }
                            if(_sqls.length) {
                                console.log('length: ', _sqls.length);
                                return _sqls.join('');
                            }else {
                                return response.error('未匹配到数据'), false;
                            }
                        }, function (err, rows){
                            if(err){
                                response.error(err);
                            }else {
                                response.success("导入成功");
                            }
                        }).commit();
                }
            }
        }
    });

});
