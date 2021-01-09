var React = require('react');
var DefectiveProductStock = require('./DefectiveProductStock.js');
module.exports = React.createClass({
	getInitialState: function (){
		return {
			where: null,
			productType: null
		};
	},
	__onSearchKeyUp: function(event){
        var _event = event.nativeEvent;
        if(_event.keyCode==13){
            var _value = _event.target.value;
			this.setState({
				where: _value?{
					'model&like': _value
				}:null
			});
        }
    },
    __onSearchChange: function (event){
        var _event = event.nativeEvent;
        if(!_event.target.value){
			this.setState({
				where: null
			});
        }
    },
	__rightView: function (){
		return <div className="right-view">
			<div className="zn-plugin-stock-searcher">
				<input placeholder="根据型号查询商品" onChange={(event)=>this.__onSearchChange(event)} onKeyUp={(event)=>this.__onSearchKeyUp(event)} className="search-input" type="search" name="search" />
				<i className="fa fa-search" />
			</div>
		</div>;
	},
	__onTypeChange: function (value){
		this.setState({ productType: value.value });
	},
	__centerView: function (){
		return <zn.react.Select onChange={this.__onTypeChange} value={0} placeholder="根据类型查询商品" style={{padding: 5, height: 'auto', backgroundColor: '#FFF'}} data={zn.store.post("/zn.plugin.admin/model/select", {
			model: 'zn_plugin_stock_product_type',
			fields: "id as value, zn_title as text",
			where: { zn_tree_pid: 0 }
		})} />;
	},
	__clearStock: function (){
		var _self = this;
		zn.confirm('清空库存是不可逆操作, 将清空库存数据, 确定继续吗？','提示', function (){
			zn.http.post('/oa/stock/clearStock', {
				warehouse: 8
			}).then(function (data){
				zn.notification.success('清空成功！');
				window.location.reload();
			});
		});
	},
	render:function(){
		return (
			<zn.react.Page title={<div><span>残次库存管理</span><span onClick={this.__clearStock} className="zr-tag fa fa-trash danger">一键清仓</span></div>} headerCenter={this.__centerView()} rightView={this.__rightView()} >
				<DefectiveProductStock warehouseId={8} where={this.state.where} productType={this.state.productType} />
			</zn.react.Page>
		);
	}
});
