require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

# One pod for the whole media kit: the audio module (ios/Audio), the video module
# (ios/Video) and the infrastructure both share (ios/Shared).
Pod::Spec.new do |s|
  s.name           = 'KnitMedia'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platforms      = {
    :ios => '16.4',
    :tvos => '16.4'
  }
  s.swift_version  = '5.9'
  s.source         = { git: 'https://github.com/the-haus/knitui.git' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,swift}"
  s.tvos.exclude_files = "**/AudioRecorder.swift",
                         "**/AudioRecordingRequester.swift",
                         "**/RecordingDelegate.swift"
end
