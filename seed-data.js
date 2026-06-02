// Seed data for Sard Chocolate
// Run via: window.seedFirestoreData(true)

window.seedFirestoreData = function(clearExisting) {

    var products = [
        {
            name: 'شوكولاتة داكنة 70%',
            brand: 'سرد',
            category: 'شوكولاتة داكنة',
            price: 25,
            image: 'https://images.unsplash.com/photo-1548907040-4baa42d10919?w=400&h=400&fit=crop',
            description: 'شوكولاتة داكنة فاخرة بنسبة كاكاو 70% - طعم غني ومميز',
            status: 'bestseller',
            inStock: true,
            order: 1
        },
        {
            name: 'ترافل شوكولاتة كلاسيك',
            brand: 'سرد',
            category: 'ترافل',
            price: 35,
            image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=400&h=400&fit=crop',
            description: 'ترافل شوكولاتة كلاسيكي بحشوة كريمية ذائبة',
            status: 'bestseller',
            inStock: true,
            order: 2
        },
        {
            name: 'شوكولاتة بالحليب',
            brand: 'سرد',
            category: 'شوكولاتة حليب',
            price: 20,
            image: 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=400&h=400&fit=crop',
            description: 'شوكولاتة حليب ناعمة وكريمية بمذاق لا يقاوم',
            status: '',
            inStock: true,
            order: 3
        },
        {
            name: 'بوكس هدية فاخر - 24 قطعة',
            brand: 'سرد',
            category: 'بوكسات هدايا',
            price: 120,
            image: 'https://images.unsplash.com/photo-1526081347589-7fa3cb41b4b2?w=400&h=400&fit=crop',
            description: 'بوكس هدية أنيق يحتوي على 24 قطعة شوكولاتة متنوعة',
            status: 'special',
            inStock: true,
            order: 4
        },
        {
            name: 'شوكولاتة بالبندق',
            brand: 'سرد',
            category: 'شوكولاتة محشية',
            price: 30,
            image: 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=400&h=400&fit=crop',
            description: 'شوكولاتة فاخرة محشية بالبندق المحمص الكامل',
            status: 'bestseller',
            inStock: true,
            order: 5
        },
        {
            name: 'ترافل كراميل مملح',
            brand: 'سرد',
            category: 'ترافل',
            price: 38,
            image: 'https://images.unsplash.com/photo-1551529834-525807d6b4f3?w=400&h=400&fit=crop',
            description: 'ترافل بحشوة كراميل مملح ذائبة مغطى بشوكولاتة داكنة',
            status: 'special',
            inStock: true,
            order: 6
        },
        {
            name: 'شوكولاتة بيضاء بالفراولة',
            brand: 'سرد',
            category: 'شوكولاتة بيضاء',
            price: 28,
            image: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=400&h=400&fit=crop',
            description: 'شوكولاتة بيضاء كريمية بنكهة الفراولة الطبيعية',
            status: '',
            inStock: true,
            order: 7
        },
        {
            name: 'بوكس مناسبات - 36 قطعة',
            brand: 'سرد',
            category: 'بوكسات هدايا',
            price: 180,
            image: 'https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?w=400&h=400&fit=crop',
            description: 'بوكس مناسبات راقي يحتوي على 36 قطعة شوكولاتة مشكلة',
            status: 'special',
            inStock: true,
            order: 8
        },
        {
            name: 'شوكولاتة بالفستق',
            brand: 'سرد',
            category: 'شوكولاتة محشية',
            price: 35,
            image: 'https://images.unsplash.com/photo-1616696701878-1d06dcf22be8?w=400&h=400&fit=crop',
            description: 'شوكولاتة فاخرة محشية بكريمة الفستق الحلبي',
            status: 'bestseller',
            inStock: true,
            order: 9
        },
        {
            name: 'ترافل ماتشا',
            brand: 'سرد',
            category: 'ترافل',
            price: 40,
            image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=400&fit=crop',
            description: 'ترافل بنكهة الماتشا اليابانية الأصلية مع شوكولاتة بيضاء',
            status: '',
            inStock: true,
            order: 10
        },
        {
            name: 'شوكولاتة داكنة بالبرتقال',
            brand: 'سرد',
            category: 'شوكولاتة داكنة',
            price: 27,
            image: 'https://images.unsplash.com/photo-1542843137-8791a6904d14?w=400&h=400&fit=crop',
            description: 'شوكولاتة داكنة بزيت البرتقال الطبيعي - مزيج منعش',
            status: '',
            inStock: true,
            order: 11
        },
        {
            name: 'بوكس صغير - 12 قطعة',
            brand: 'سرد',
            category: 'بوكسات هدايا',
            price: 65,
            image: 'https://images.unsplash.com/photo-1582176604856-e644f0cb4020?w=400&h=400&fit=crop',
            description: 'بوكس صغير أنيق مثالي كهدية - 12 قطعة متنوعة',
            status: '',
            inStock: true,
            order: 12
        },
        {
            name: 'شوكولاتة حليب بالكراميل',
            brand: 'سرد',
            category: 'شوكولاتة حليب',
            price: 22,
            image: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400&h=400&fit=crop',
            description: 'شوكولاتة حليب كريمية بحشوة كراميل ذائبة',
            status: '',
            inStock: true,
            order: 13
        },
        {
            name: 'ترافل لوتس',
            brand: 'سرد',
            category: 'ترافل',
            price: 38,
            image: 'https://images.unsplash.com/photo-1571506165871-ee72a35bc9d4?w=400&h=400&fit=crop',
            description: 'ترافل بحشوة كريمة اللوتس المميزة مع شوكولاتة حليب',
            status: 'bestseller',
            inStock: true,
            order: 14
        },
        {
            name: 'شوكولاتة بالجوز',
            brand: 'سرد',
            category: 'شوكولاتة محشية',
            price: 32,
            image: 'https://images.unsplash.com/photo-1575377427642-087cf684f29d?w=400&h=400&fit=crop',
            description: 'شوكولاتة فاخرة بقطع الجوز المحمص',
            status: '',
            inStock: true,
            order: 15
        },
        {
            name: 'شوكولاتة بيضاء بالتوت',
            brand: 'سرد',
            category: 'شوكولاتة بيضاء',
            price: 28,
            image: 'https://images.unsplash.com/photo-1587132117083-5b4f83ea2f5b?w=400&h=400&fit=crop',
            description: 'شوكولاتة بيضاء مع قطع التوت المجفف',
            status: '',
            inStock: true,
            order: 16
        },
        {
            name: 'بوكس VIP - 48 قطعة',
            brand: 'سرد',
            category: 'بوكسات هدايا',
            price: 250,
            image: 'https://images.unsplash.com/photo-1548741487-18d363dc4469?w=400&h=400&fit=crop',
            description: 'بوكس VIP فاخر - 48 قطعة شوكولاتة مميزة بتغليف حصري',
            status: 'special',
            inStock: true,
            order: 17
        },
        {
            name: 'ترافل نوتيلا',
            brand: 'سرد',
            category: 'ترافل',
            price: 36,
            image: 'https://images.unsplash.com/photo-1587132137056-bfbf0166836e?w=400&h=400&fit=crop',
            description: 'ترافل بحشوة نوتيلا كريمية مغطى بشوكولاتة حليب',
            status: '',
            inStock: true,
            order: 18
        },
        {
            name: 'شوكولاتة داكنة 85%',
            brand: 'سرد',
            category: 'شوكولاتة داكنة',
            price: 30,
            image: 'https://images.unsplash.com/photo-1553452118-621e1f860f43?w=400&h=400&fit=crop',
            description: 'شوكولاتة داكنة للخبراء بنسبة كاكاو 85% - مرة ومميزة',
            status: '',
            inStock: true,
            order: 19
        },
        {
            name: 'شوكولاتة باللوز',
            brand: 'سرد',
            category: 'شوكولاتة محشية',
            price: 32,
            image: 'https://images.unsplash.com/photo-1614088685112-0a760b71a3c8?w=400&h=400&fit=crop',
            description: 'شوكولاتة بقطع اللوز المحمص الكبيرة',
            status: '',
            inStock: true,
            order: 20
        },
        {
            name: 'بوكس أعراس مخصص',
            brand: 'سرد',
            category: 'بوكسات هدايا',
            price: 15,
            image: 'https://images.unsplash.com/photo-1511381939415-e44015466834?w=400&h=400&fit=crop',
            description: 'بوكس أعراس مخصص - قطعة واحدة بتغليف خاص (الحد الأدنى 50 قطعة)',
            status: 'special',
            inStock: true,
            order: 21
        },
        {
            name: 'ترافل زعفران',
            brand: 'سرد',
            category: 'ترافل',
            price: 45,
            image: 'https://images.unsplash.com/photo-1587132117083-5b4f83ea2f5b?w=400&h=400&fit=crop',
            description: 'ترافل فاخر بالزعفران الأصلي - إصدار محدود',
            status: 'special',
            inStock: true,
            order: 22
        },
        {
            name: 'شوكولاتة حليب بالكوكيز',
            brand: 'سرد',
            category: 'شوكولاتة حليب',
            price: 24,
            image: 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=400&h=400&fit=crop',
            description: 'شوكولاتة حليب بقطع الكوكيز المقرمشة',
            status: '',
            inStock: true,
            order: 23
        },
        {
            name: 'شوكولاتة بيضاء بالمانجو',
            brand: 'سرد',
            category: 'شوكولاتة بيضاء',
            price: 28,
            image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=400&fit=crop',
            description: 'شوكولاتة بيضاء استوائية بنكهة المانجو الطبيعية',
            status: '',
            inStock: true,
            order: 24
        }
    ];

    var discounts = [
        {
            type: 'category',
            value: 'ترافل',
            percentage: 15,
            message: 'خصم 15% على جميع الترافل',
            active: true,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            type: 'category',
            value: 'بوكسات هدايا',
            percentage: 10,
            message: 'خصم 10% على بوكسات الهدايا',
            active: true,
            expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
        }
    ];

    var settings = {
        whatsapp: '970595455369',
        heroSubtitle: 'شوكولاتة فاخرة مصنوعة بحب وعناية',
        aboutText: 'سرد شوكولاتة - مصنع شوكولاتة فلسطيني متخصص بصناعة الشوكولاتة الفاخرة والترافل والبوكسات المخصصة.\nنقدم لكم أجود أنواع الشوكولاتة بأيدي فلسطينية ماهرة مع إمكانية التخصيص الكامل لجميع المناسبات.',
        instagram: 'https://www.instagram.com/sardchocolate.ps/',
        tiktok: ''
    };

    function doSeed() {
        var batch = db.batch();
        var productsRef = db.collection('products');
        var discountsRef = db.collection('discounts');
        var settingsRef = db.collection('settings');

        if (clearExisting) {
            console.log('Seeding with clear mode - adding all products...');
        }

        products.forEach(function(product, index) {
            var docRef = productsRef.doc('prod_' + (index + 1));
            product.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            batch.set(docRef, product);
        });

        discounts.forEach(function(discount, index) {
            var docRef = discountsRef.doc('disc_' + (index + 1));
            batch.set(docRef, discount);
        });

        batch.set(settingsRef.doc('general'), settings);

        return batch.commit().then(function() {
            console.log('Seeded ' + products.length + ' products, ' + discounts.length + ' discounts, and settings.');
            return products.length;
        });
    }

    if (clearExisting) {
        return db.collection('products').get().then(function(snapshot) {
            var deleteBatch = db.batch();
            snapshot.forEach(function(doc) { deleteBatch.delete(doc.ref); });
            return deleteBatch.commit();
        }).then(function() {
            return db.collection('discounts').get();
        }).then(function(snapshot) {
            var deleteBatch = db.batch();
            snapshot.forEach(function(doc) { deleteBatch.delete(doc.ref); });
            return deleteBatch.commit();
        }).then(function() {
            return doSeed();
        });
    } else {
        return doSeed();
    }
};
