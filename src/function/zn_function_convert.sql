set global log_bin_trust_function_creators = 1;
----
DROP FUNCTION IF EXISTS zn_chunrui_oa_convert_customer;
CREATE FUNCTION zn_chunrui_oa_convert_customer($id int(11))
RETURNS VARCHAR(50)
BEGIN
DECLARE _temp varchar(50);
select zn_title INTO _temp from zn_chunrui_oa_customer where id=$id;
RETURN _temp;
END
----
DROP FUNCTION IF EXISTS zn_chunrui_oa_convert_supplier;
CREATE FUNCTION zn_chunrui_oa_convert_supplier($id int(11))
RETURNS VARCHAR(50)
BEGIN
DECLARE _temp varchar(50);
select zn_title INTO _temp from zn_chunrui_oa_supplier where id=$id;
RETURN _temp;
END
