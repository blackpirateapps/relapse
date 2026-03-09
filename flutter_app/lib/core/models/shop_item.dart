class ShopItem {
  const ShopItem({
    required this.id,
    required this.name,
    required this.description,
    required this.cost,
    required this.type,
    this.previewImage,
    this.growthHours,
    this.sortOrder = 0,
    this.images = const [],
  });

  final String id;
  final String name;
  final String description;
  final int cost;
  final String type; // phoenix_skin, background_theme, forest_theme, phoenix_aura, potion, tree_sapling
  final String? previewImage;
  final int? growthHours;
  final int sortOrder;
  final List<ShopItemImage> images;

  factory ShopItem.fromJson(Map<String, dynamic> json) {
    final imageList = (json['images'] as List<dynamic>?)
        ?.map((e) => ShopItemImage.fromJson(e as Map<String, dynamic>))
        .toList() ?? [];
    return ShopItem(
      id: json['id'] as String,
      name: json['name'] as String? ?? '',
      description: json['description'] as String? ?? '',
      cost: (json['cost'] as num?)?.toInt() ?? 0,
      type: json['type'] as String? ?? '',
      previewImage: json['preview_image'] as String?,
      growthHours: (json['growth_hours'] as num?)?.toInt(),
      sortOrder: (json['sort_order'] as num?)?.toInt() ?? 0,
      images: imageList,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'description': description,
    'cost': cost,
    'type': type,
    'preview_image': previewImage,
    'growth_hours': growthHours,
    'sort_order': sortOrder,
    'images': images.map((e) => e.toJson()).toList(),
  };

  /// User-friendly category label.
  String get categoryLabel {
    switch (type) {
      case 'phoenix_skin': return 'Skins';
      case 'background_theme': return 'Backgrounds';
      case 'forest_theme': return 'Forest';
      case 'phoenix_aura': return 'Auras';
      case 'potion': return 'Potions';
      case 'tree_sapling': return 'Trees';
      default: return 'Other';
    }
  }
}

class ShopItemImage {
  const ShopItemImage({
    required this.imageUrl,
    this.imageType,
    this.stageName,
    this.stageHours,
  });

  final String imageUrl;
  final String? imageType;
  final String? stageName;
  final int? stageHours;

  factory ShopItemImage.fromJson(Map<String, dynamic> json) {
    return ShopItemImage(
      imageUrl: json['image_url'] as String? ?? '',
      imageType: json['image_type'] as String?,
      stageName: json['stage_name'] as String?,
      stageHours: (json['stage_hours'] as num?)?.toInt(),
    );
  }

  Map<String, dynamic> toJson() => {
    'image_url': imageUrl,
    'image_type': imageType,
    'stage_name': stageName,
    'stage_hours': stageHours,
  };
}
