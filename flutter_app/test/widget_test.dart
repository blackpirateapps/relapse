import 'package:flutter_test/flutter_test.dart';

import 'package:phoenix_native/app.dart';

void main() {
  testWidgets('app boots', (WidgetTester tester) async {
    await tester.pumpWidget(const PhoenixNativeApp());
    expect(find.text('Phoenix Journey'), findsOneWidget);
  });
}
