zn.define(function (){

    return zn.Controller('customer_bill', {
        methods: {
            recharge: {
                method: 'GET/POST',
                argv: {
                    id: null,
                    account: null,
                    zn_note: null
                },
                value: function(request, response, chain){
                    var _id = request.getValue('id');
                        _account = request.getValue('account');
                        _zn_note = request.getValue('zn_note');
                    this.beginTransaction()
                        .query("select account:", function(){
                            return zn.sql.select({
                                table: 'zn_chunrui_oa_customer',
                                fields: 'account',
                                where: { id: _id }
                            });
                        })
                        .query("update account:", function(sql, rows){
                            var _values = {};
                                _item = rows[0];
                                _values.account = Number(_account) + Number(_item.account);
                            return zn.sql.update({
                                table: 'zn_chunrui_oa_customer',
                                updates: _values,
                                where: { id: _id }
                            });
                        })
                        .query("insert customer_bill:", function(sql, data){
                            var _insert = {};
                                _insert.customer_id = _id;
                                _insert.total_price = _account;
                                _insert.zn_note = _zn_note;
                                _insert.state = 1;
                            return zn.sql.insert({
                                table: 'zn_chunrui_oa_customer_bill',
                                values: _insert
                            })
                        },function(err, data){
                            if(err){
                                response.error(err);
                            }else{
                                response.success(data);
                            }
                        })
                        .commit();
                }
            },

        }
    });

});
