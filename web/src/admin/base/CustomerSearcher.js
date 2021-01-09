var React = require('react');

module.exports = zn.CustomerSearcher = React.createClass({
	getInitialState: function () {
		return {
			data: zn.store.post('/zn.plugin.admin/model/paging', {
				model: 'ChunRuiOACustomer'
			}),
			value: 0,
			text: ''
		}
	},
	setValue: function (value){
		this.setState({ value: value });
	},
	getValue: function (){
		return this.state.value;
	},
	__onItemRender: function (item, index){
		return item.zn_title;
	},
	__onSearch: function (value){
		this.state.data._data.where = { 'zn_title&like': value };
		this.state.data.refresh();
	},
	__onCancel: function (){
		this.state.data._data.where = null;
		delete this.state.data._data.where;
		this.state.data.refresh();
	},
	__onItemClick: function (value){
		if(value==this.state.value){
			return false;
		}
		this.setState({
			value: value.value,
			text: value.item.zn_title
		});
		zn.popover.close();
		this.props.onChange && this.props.onChange(value, this, this.props.form);
	},
	__onPopClick: function (event){
		event.stopPropagation();
	},
	__popoverRender: function (){
		return <div onClick={this.__onPopClick}>
			<zn.react.Search style={{backgroundColor: '#FFF'}} onSearch={this.__onSearch} onCancel={this.__onCancel} />
			<zn.react.PagerView
				{...this.props}
				view="ListView"
				valueKey="id"
				value={this.state.value}
				showLoading={false}
				onClick={this.__onItemClick}
				itemRender={this.__onItemRender}
				data={this.state.data}/>
		</div>;
	},
	render:function(){
		return (
			<zn.react.Dropdown
				style={{width:'100%'}}
				height="auto"
				popoverRender={this.__popoverRender}
				popoverWidth={500} >
				<div style={{width: '100%', backgroundColor: '#f9f9f9', height: 30, borderRadius: 3, padding: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
					<span>{this.state.text}</span>
					<i className="fa fa-angle-down"/>
				</div>
			</zn.react.Dropdown>
		);
	}
});
