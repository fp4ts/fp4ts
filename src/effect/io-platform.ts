export const PlatformConfig = Object.freeze({
  AUTO_SUSPEND_THRESHOLD: parseInt(
    process.env.EFFECT_IO_AUTO_SUSPEND_THRESHOLD ?? '512',
    10,
  ),
});
