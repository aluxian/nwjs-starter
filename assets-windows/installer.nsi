!include "MUI2.nsh"

Name "Unofficial WhatsApp"
BrandingText "aluxian.com"

# set the icon
!define MUI_ICON "icon.ico"

# define the resulting installer's name:
OutFile "..\dist\UnofficialWhatsAppSetup.exe"

# set the installation directory
InstallDir "$PROGRAMFILES\Unofficial WhatsApp for Desktop\"

# app dialogs
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_INSTFILES

!define MUI_FINISHPAGE_RUN_TEXT "Start Unofficial WhatsApp"
!define MUI_FINISHPAGE_RUN "$INSTDIR\UnofficialWhatsApp.exe"

!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_LANGUAGE "English"

# default section start
Section

  # delete the installed files
  RMDir /r $INSTDIR

  # define the path to which the installer should install
  SetOutPath $INSTDIR

  # specify the files to go in the output path
  File /r ..\build\UnofficialWhatsApp\win32\*

  # create the uninstaller
  WriteUninstaller "$INSTDIR\Uninstall Unofficial WhatsApp for Desktop.exe"

  # create shortcuts in the start menu and on the desktop
  CreateShortCut "$SMPROGRAMS\Unofficial WhatsApp.lnk" "$INSTDIR\UnofficialWhatsApp.exe"
  CreateShortCut "$SMPROGRAMS\Uninstall Unofficial WhatsApp for Desktop.lnk" "$INSTDIR\Uninstall Unofficial WhatsApp for Desktop.exe"
  CreateShortCut "$DESKTOP\Unofficial WhatsApp.lnk" "$INSTDIR\UnofficialWhatsApp.exe"

SectionEnd

# create a section to define what the uninstaller does
Section "Uninstall"

  # delete the installed files
  RMDir /r $INSTDIR

  # delete the shortcuts
  Delete "$SMPROGRAMS\Unofficial WhatsApp.lnk"
  Delete "$SMPROGRAMS\Uninstall Unofficial WhatsApp for Desktop.lnk"
  Delete "$DESKTOP\Unofficial WhatsApp.lnk"

SectionEnd
