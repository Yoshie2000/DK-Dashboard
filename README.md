# DK-Dashboard
A dashboard for students that use the software "Digitales Klassenbuch"

# Get the installer
The installers are located [here](https://github.com/Yoshie2000/DK-Dashboard/tree/master/release-builds). If you don't find the installer for your operating system, you will have to go through the steps "Build it yourself" and "Create a custom installer".

# Build it yourself
1. Clone the project<br/>
  `https://github.com/Yoshie2000/DK-Dashboard.git`
2. Initialize npm (Just press enter every time a prompt appears)<br/>
  `npm init`
3. Download all the dependencies<br/>
  `npm install`
4. Start the app<br/>
  `npm start`<br/>
  Now you can modify the source code and see the changes. If you want to create a custom installer, the the section "Create a custom installer".

# Create a custom installer
## Windows
1. Build the app<br/>
  `npm run package-win`
2. Create the installer<br/>
  `npm run create-installer-win`
3. Your installer is now located in the `release-builds/windows-installer` folder. A normal distribution of your app is located in the `release-builds/dk_dashboard-win32-ia32` folder
## Mac
1. Build the app<br/>
  `npm run package-mac`
2. Create the installer<br/>
  `npm run create-installer-mac`
3. Your installer is now located in the `release-builds/mac-installer` folder.
