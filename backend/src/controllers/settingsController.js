const fs = require('fs');
const path = require('path');

const SETTINGS_FILE_PATH = path.join(__dirname, '../../data/settings.json');

const DEFAULT_SOCIAL_LINKS = {
  instagram: 'https://instagram.com',
  twitter: 'https://twitter.com',
  youtube: 'https://youtube.com',
  facebook: 'https://facebook.com',
  linkedin: 'https://linkedin.com',
  threads: 'https://threads.net'
};

// Ensure data directory and file exist
const ensureSettingsFile = () => {
  const dir = path.dirname(SETTINGS_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(SETTINGS_FILE_PATH)) {
    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify({ socialLinks: DEFAULT_SOCIAL_LINKS }, null, 2));
  }
};

const readSettings = () => {
  try {
    ensureSettingsFile();
    const rawData = fs.readFileSync(SETTINGS_FILE_PATH, 'utf8');
    const parsed = JSON.parse(rawData);
    return {
      socialLinks: { ...DEFAULT_SOCIAL_LINKS, ...(parsed.socialLinks || {}) }
    };
  } catch (error) {
    console.error('Error reading settings file:', error);
    return { socialLinks: DEFAULT_SOCIAL_LINKS };
  }
};

const writeSettings = (newSettings) => {
  try {
    ensureSettingsFile();
    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(newSettings, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing settings file:', error);
    return false;
  }
};

// @desc    Get social media links
// @route   GET /api/settings/social-links
// @access  Public
const getSocialLinks = async (req, res, next) => {
  try {
    const settings = readSettings();
    res.status(200).json({
      success: true,
      data: settings.socialLinks
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update social media links
// @route   PUT /api/settings/social-links
// @access  Private/Admin
const updateSocialLinks = async (req, res, next) => {
  try {
    const { instagram, twitter, youtube, facebook, linkedin, threads } = req.body;

    const currentSettings = readSettings();
    const updatedSocialLinks = {
      instagram: instagram ?? currentSettings.socialLinks.instagram,
      twitter: twitter ?? currentSettings.socialLinks.twitter,
      youtube: youtube ?? currentSettings.socialLinks.youtube,
      facebook: facebook ?? currentSettings.socialLinks.facebook,
      linkedin: linkedin ?? currentSettings.socialLinks.linkedin,
      threads: threads ?? currentSettings.socialLinks.threads
    };

    const newSettings = {
      ...currentSettings,
      socialLinks: updatedSocialLinks
    };

    const saved = writeSettings(newSettings);
    if (!saved) {
      return res.status(500).json({
        success: false,
        message: 'Gagal menyimpan pengaturan link social media'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Link social media berhasil diperbarui',
      data: updatedSocialLinks
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSocialLinks,
  updateSocialLinks
};
