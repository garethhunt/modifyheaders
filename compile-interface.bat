@echo off
REM Modify this file to suite your environment
set XPIDL_EXE=c:\software\gecko-sdk\bin\xpidl.exe
set XPIDL_INC=C:\software\gecko-sdk\idl

set TPL_SRC=src/interface/nsIModifyheaders.idl
set TPL_TRG=target/interface/nsIModifyheaders

%XPIDL_EXE% -m typelib -v -I %XPIDL_INC% -w -o %TPL_TRG% %TPL_SRC%