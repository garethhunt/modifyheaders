#!/bin/bash

# @echo off
# REM Modify this file to suite your environment
# set XPIDL_EXE=c:\software\gecko-sdk\bin\xpidl.exe
# set XPIDL_INC=C:\software\gecko-sdk\idl
export TYPELIB_EXE='/opt/xulrunner-sdk/sdk/bin/typelib.py'
export XPIDL_INC='/opt/xulrunner-sdk/idl'

export TPL_SRC='src/interface'
export TPL_TRG='target/interface'

# @echo on
$TYPELIB_EXE src/interface/nsIModifyheaders.idl -o target/interface/nsIModifyheaders.xpt -I $XPIDL_INC
$TYPELIB_EXE src/interface/mhIHeader.idl -o target/interface/mhIHeader.xpt -I $XPIDL_INC
