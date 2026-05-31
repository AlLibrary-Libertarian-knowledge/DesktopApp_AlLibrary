//! OS-specific process spawn helpers.

#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x08000000;

/// Prevent console windows when spawning child processes on Windows.
#[cfg(windows)]
pub fn hide_console(cmd: &mut std::process::Command) {
    use std::os::windows::process::CommandExt;
    cmd.creation_flags(CREATE_NO_WINDOW);
}

#[cfg(not(windows))]
pub fn hide_console(_cmd: &mut std::process::Command) {}

/// Prevent console windows when spawning async child processes on Windows.
#[cfg(windows)]
pub fn hide_console_async(cmd: &mut tokio::process::Command) {
    cmd.creation_flags(CREATE_NO_WINDOW);
}

#[cfg(not(windows))]
pub fn hide_console_async(_cmd: &mut tokio::process::Command) {}
