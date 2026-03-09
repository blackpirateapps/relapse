package com.relapse.phoenix;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;

import androidx.core.app.NotificationCompat;

public class StreakNotificationService extends Service {
  public static final String ACTION_START = "com.relapse.phoenix.ACTION_STREAK_START";
  public static final String ACTION_STOP = "com.relapse.phoenix.ACTION_STREAK_STOP";
  public static final String EXTRA_STARTED_AT_MS = "startedAtMs";
  public static final String CHANNEL_ID = "streak_timer_channel";
  public static final int NOTIFICATION_ID = 7331;

  private final Handler handler = new Handler(Looper.getMainLooper());
  private long startedAtMs = 0L;
  private final Runnable ticker = new Runnable() {
    @Override
    public void run() {
      if (startedAtMs > 0) {
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        manager.notify(NOTIFICATION_ID, buildNotification());
        handler.postDelayed(this, 1000);
      }
    }
  };

  @Override
  public int onStartCommand(Intent intent, int flags, int startId) {
    if (intent == null) {
      return START_STICKY;
    }

    String action = intent.getAction();

    if (ACTION_STOP.equals(action)) {
      stopTicker();
      stopForeground(STOP_FOREGROUND_REMOVE);
      stopSelf();
      return START_NOT_STICKY;
    }

    if (ACTION_START.equals(action)) {
      long candidate = intent.getLongExtra(EXTRA_STARTED_AT_MS, 0L);
      if (candidate > 0) {
        startedAtMs = candidate;
        startForeground(NOTIFICATION_ID, buildNotification());
        restartTicker();
      }
      return START_STICKY;
    }

    return START_STICKY;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    createChannel();
  }

  @Override
  public void onDestroy() {
    stopTicker();
    super.onDestroy();
  }

  @Override
  public IBinder onBind(Intent intent) {
    return null;
  }

  private void restartTicker() {
    handler.removeCallbacks(ticker);
    handler.post(ticker);
  }

  private void stopTicker() {
    handler.removeCallbacks(ticker);
  }

  private Notification buildNotification() {
    Intent launchIntent = getPackageManager().getLaunchIntentForPackage(getPackageName());
    PendingIntent pendingIntent = PendingIntent.getActivity(
      this,
      0,
      launchIntent,
      PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
    );

    return new NotificationCompat.Builder(this, CHANNEL_ID)
      .setContentTitle("Phoenix Journey")
      .setContentText(formatElapsed(System.currentTimeMillis() - startedAtMs))
      .setSmallIcon(getApplicationInfo().icon)
      .setOnlyAlertOnce(true)
      .setOngoing(true)
      .setContentIntent(pendingIntent)
      .build();
  }

  private String formatElapsed(long elapsedMs) {
    long safe = Math.max(0L, elapsedMs);
    long days = safe / (24L * 60L * 60L * 1000L);
    long hours = (safe / (60L * 60L * 1000L)) % 24L;
    long minutes = (safe / (60L * 1000L)) % 60L;
    long seconds = (safe / 1000L) % 60L;

    return String.format("Streak %dd %02dh %02dm %02ds", days, hours, minutes, seconds);
  }

  private void createChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return;
    }

    NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
    NotificationChannel channel = new NotificationChannel(
      CHANNEL_ID,
      "Streak Timer",
      NotificationManager.IMPORTANCE_LOW
    );
    channel.setDescription("Shows your ongoing Phoenix streak timer");
    manager.createNotificationChannel(channel);
  }
}
