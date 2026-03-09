package com.relapse.phoenix;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "StreakNotification")
public class StreakNotificationPlugin extends Plugin {

  @PluginMethod
  public void start(PluginCall call) {
    if (!hasNotificationPermission()) {
      call.reject("Notification permission not granted");
      return;
    }

    Long startedAtMs = call.getLong("startedAtMs");
    if (startedAtMs == null || startedAtMs <= 0L) {
      call.reject("startedAtMs is required");
      return;
    }

    Intent intent = new Intent(getContext(), StreakNotificationService.class);
    intent.setAction(StreakNotificationService.ACTION_START);
    intent.putExtra(StreakNotificationService.EXTRA_STARTED_AT_MS, startedAtMs);
    ContextCompat.startForegroundService(getContext(), intent);

    JSObject result = new JSObject();
    result.put("running", true);
    call.resolve(result);
  }

  @PluginMethod
  public void stop(PluginCall call) {
    Intent intent = new Intent(getContext(), StreakNotificationService.class);
    intent.setAction(StreakNotificationService.ACTION_STOP);
    getContext().startService(intent);

    JSObject result = new JSObject();
    result.put("running", false);
    call.resolve(result);
  }

  private boolean hasNotificationPermission() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
      return true;
    }

    return getContext().checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)
      == PackageManager.PERMISSION_GRANTED;
  }
}
