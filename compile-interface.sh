#!/bin/bash

# @echo off
# REM Modify this file to suite your environment
# set XPIDL_EXE=c:\software\gecko-sdk\bin\xpidl.exe
# set XPIDL_INC=C:\software\gecko-sdk\idl
export XPIDL_EXE='/opt/xulrunner-sdk/bin/xpidl'
export XPIDL_INC='/opt/xulrunner-sdk/idl'

export TPL_SRC='src/interface'
export TPL_TRG='target/interface'

# @echo on
$XPIDL_EXE -m typelib -v -I $XPIDL_INC -w -o $TPL_TRG/nsIModifyheaders $TPL_SRC/nsIModifyheaders.idl
$XPIDL_EXE -m typelib -v -I $XPIDL_INC -w -o $TPL_TRG/mhIHeader $TPL_SRC/mhIHeader.idl
