import 'package:flutter/material.dart';

import '../core/state/app_state.dart';

class LoginGate extends StatefulWidget {
  const LoginGate({super.key, required this.appState});

  final AppState appState;

  @override
  State<LoginGate> createState() => _LoginGateState();
}

class _LoginGateState extends State<LoginGate> {
  final _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const Text('Phoenix Journey', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      const Text('Enter app password', style: TextStyle(color: Colors.white70)),
                      const SizedBox(height: 16),
                      TextField(
                        controller: _controller,
                        obscureText: true,
                        decoration: const InputDecoration(labelText: 'Password'),
                        onSubmitted: (_) => _submit(),
                      ),
                      const SizedBox(height: 16),
                      if (widget.appState.error != null)
                        Text(widget.appState.error!, style: const TextStyle(color: Colors.redAccent)),
                      const SizedBox(height: 8),
                      FilledButton(
                        onPressed: widget.appState.isLoading ? null : _submit,
                        child: Text(widget.appState.isLoading ? 'Connecting...' : 'Enter'),
                      )
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _submit() async {
    await widget.appState.login(_controller.text);
  }
}
